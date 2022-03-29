import BN from 'bn.js';
import { PublicKey, TransactionSignature,sendAndConfirmTransaction, Connection, Transaction } from '@solana/web3.js';
import { TransactionsBatch } from '../../../ts/src/utils/utils';
import { actions, NodeWallet } from '@metaplex/js';
const {createApproveTxs, createWrappedAccountTxs, prepareTokenAccountAndMintTxs} = actions;
import { getBidRedemptionPDA } from './redeemTokenOnlyBid';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Auction, AuctionExtended, BidderMetadata } from '@metaplex-foundation/mpl-auction';
import { Vault } from '@metaplex-foundation/mpl-token-vault';
import {
  AuctionManager,
  NonWinningConstraint,
  ParticipationConfigV2,
  PrizeTrackingTicket,
  RedeemParticipationBidV3,
  SafetyDepositConfig,
  WinningConstraint,
} from '@metaplex-foundation/mpl-metaplex';
import {
  Edition,
  EditionMarker,
  MasterEdition,
  Metadata,
  UpdatePrimarySaleHappenedViaToken,
} from '@metaplex-foundation/mpl-token-metadata';

export interface RedeemParticipationBidV3Params {
  connection: Connection;
  wallet: NodeWallet;
  auction: PublicKey;
  store: PublicKey;
}

export interface RedeemParticipationBidV3Response {
  txIds: TransactionSignature[];
}

export const redeemParticipationBid = async ({
  connection,
  wallet,
  store,
  auction,
}: RedeemParticipationBidV3Params): Promise<RedeemParticipationBidV3Response> => {
  const txInitBatch = new TransactionsBatch({ transactions: [] });
  const txMainBatch = new TransactionsBatch({ transactions: [] });

  const bidder = wallet.publicKey;
  const {
    data: { bidState, tokenMint: auctionTokenMint },
  } = await Auction.load(connection, auction);
  const auctionManagerPDA = await AuctionManager.getPDA(auction);
  const manager = await AuctionManager.load(connection, auctionManagerPDA);
  const vault = await Vault.load(connection, manager.data.vault);
  const auctionExtendedPDA = await AuctionExtended.getPDA(vault.pubkey);
  const [_, safetyDepositBox] = await vault.getSafetyDepositBoxes(connection);
  const originalMint = new PublicKey(safetyDepositBox.data.tokenMint);

  const safetyDepositTokenStore = new PublicKey(safetyDepositBox.data.store);
  const bidderMetaPDA = await BidderMetadata.getPDA(auction, bidder);
  const bidRedemptionPDA = await getBidRedemptionPDA(auction, bidderMetaPDA);
  const safetyDepositConfigPDA = await SafetyDepositConfig.getPDA(
    auctionManagerPDA,
    safetyDepositBox.pubkey,
  );
 
  const acceptPaymentAccount = new PublicKey(manager.data.acceptPayment);

  const { mint, createMintTx, createAssociatedTokenAccountTx, mintToTx, recipient } =
    await prepareTokenAccountAndMintTxs(connection, wallet.publicKey);

  txInitBatch.addTransaction(createMintTx);
  txInitBatch.addTransaction(createAssociatedTokenAccountTx);
  txInitBatch.addTransaction(mintToTx);

  const newMint = mint.publicKey;
  const newMetadataPDA = await Metadata.getPDA(newMint);
  const newEditionPDA = await Edition.getPDA(newMint);

  const metadataPDA = await Metadata.getPDA(originalMint);
  const masterEditionPDA = await MasterEdition.getPDA(originalMint);
  const masterEdition = await MasterEdition.load(connection, masterEditionPDA);

  const prizeTrackingTicketPDA = await PrizeTrackingTicket.getPDA(auctionManagerPDA, originalMint);
  const winIndex = bidState.getWinnerIndex(bidder.toBase58());

  const desiredEdition = masterEdition.data.supply.add(new BN(1));
  const editionMarkerPDA = await EditionMarker.getPDA(originalMint, desiredEdition);

  let tokenPaymentAccount: PublicKey;
  let account;
  if (auctionTokenMint === NATIVE_MINT.toBase58()) {
    const { account:newAccount, createTokenAccountTx, closeTokenAccountTx } = await createWrappedAccountTxs(
      connection,
      bidder,
      0,
    );
    account = newAccount;
    tokenPaymentAccount = account.publicKey;
    txInitBatch.addTransaction(createTokenAccountTx);
    //txMainBatch.addAfterTransaction(closeTokenAccountTx);
  } else {
    // TODO: find out what will happen if currency is not WSOL
    tokenPaymentAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(auctionTokenMint),
      bidder,
    );
  }

  const { authority, createApproveTx, createRevokeTx } = createApproveTxs({
    account: tokenPaymentAccount,
    owner: bidder,
    amount: 0,
  });
  txMainBatch.addTransaction(createApproveTx);
  txMainBatch.addAfterTransaction(createRevokeTx);

  const redeemParticipationBidV3Tx = new RedeemParticipationBidV3(
    { feePayer: bidder },
    {
      store,
      vault: vault.pubkey,
      auction,
      auctionManager: auctionManagerPDA,
      bidRedemption: bidRedemptionPDA,
      bidMetadata: bidderMetaPDA,
      safetyDepositTokenStore,
      destination: recipient,
      safetyDeposit: safetyDepositBox.pubkey,
      bidder,
      safetyDepositConfig: safetyDepositConfigPDA,
      auctionExtended: auctionExtendedPDA,
      newMint,
      newEdition: newEditionPDA,
      newMetadata: newMetadataPDA,
      metadata: metadataPDA,
      masterEdition: masterEditionPDA,
      editionMark: editionMarkerPDA,
      prizeTrackingTicket: prizeTrackingTicketPDA,
      winIndex: winIndex !== null ? new BN(winIndex) : null,
      transferAuthority: authority.publicKey,
      tokenPaymentAccount,
      acceptPaymentAccount,
    },
  );
  txMainBatch.addTransaction(redeemParticipationBidV3Tx);

  const updatePrimarySaleHappenedViaTokenTx = new UpdatePrimarySaleHappenedViaToken(
    { feePayer: bidder },
    {
      metadata: newMetadataPDA,
      owner: bidder,
      tokenAccount: recipient,
    },
  );
  txMainBatch.addTransaction(updatePrimarySaleHappenedViaTokenTx);

  const initTx = new Transaction()
  initTx.add(...txInitBatch.toTransactions())


  const initTxId = await sendAndConfirmTransaction(connection, initTx, [wallet.payer, mint, account], {commitment:"finalized"})

  const mainTx = new Transaction();
  mainTx.add(...txMainBatch.toTransactions())


  const mainTxId = await sendAndConfirmTransaction(connection ,mainTx, [wallet.payer, authority], {commitment:"finalized"} )


  return { txIds: [initTxId, mainTxId] };
};

export function isEligibleForParticipationPrize(
  winIndex: number,
  { nonWinningConstraint, winnerConstraint }: ParticipationConfigV2 = {} as ParticipationConfigV2,
) {
  const noWinnerConstraints = winnerConstraint !== WinningConstraint.NoParticipationPrize;
  const noNonWinnerConstraints = nonWinningConstraint !== NonWinningConstraint.NoParticipationPrize;
  return (
    (winIndex === null && noNonWinnerConstraints) || (winIndex !== null && noWinnerConstraints)
  );
}