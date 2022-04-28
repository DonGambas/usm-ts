import BN from 'bn.js';
import { Commitment, Keypair, PublicKey, TransactionSignature, LAMPORTS_PER_SOL, AccountInfo} from '@solana/web3.js';
import { AccountLayout } from '@solana/spl-token';
import { Connection, Wallet } from '@metaplex/js';
import fetch from "cross-fetch";

import { Metadata, MetadataDataData } from '@metaplex-foundation/mpl-token-metadata';
import { Account } from '@metaplex-foundation/mpl-core';

import {
  Auction,
  AuctionProgram,
  AuctionExtended,
  BidderMetadata,
  BidderPot,
  PlaceBid,
  AuctionState as AuctionStateEnum,
  BidderMetadataData
} from '@metaplex-foundation/mpl-auction';

import {
  Vault,
} from '@metaplex-foundation/mpl-token-vault';

import { AuctionManager, ClaimBid } from '@metaplex-foundation/mpl-metaplex';
import { actions} from '@metaplex/js';
const { getCancelBidTransactions, createApproveTxs, createWrappedAccountTxs, sendTransaction} = actions;

import { Transaction } from '@metaplex-foundation/mpl-core';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { web3 } from '@project-serum/anchor';
import { getBidRedemptionTicket, hasRedeemedBid } from './hasRedeemedBid';

import fs from 'fs';
import path from 'path';

const getBidderPotTokenPDA = async (bidderPotPubKey) =>{
  return AuctionProgram.findProgramAddress([
    Buffer.from(AuctionProgram.PREFIX),
    bidderPotPubKey.toBuffer(),
    Buffer.from('bidder_pot_token'),
  ]);

} 


interface TransactionsBatchParams {
  beforeTransactions?: Transaction[];
  transactions: Transaction[];
  afterTransactions?: Transaction[];
}

export class TransactionsBatch {
  beforeTransactions: Transaction[];
  transactions: Transaction[];
  afterTransactions: Transaction[];

  signers: Keypair[] = [];

  constructor({
    beforeTransactions = [],
    transactions,
    afterTransactions = [],
  }: TransactionsBatchParams) {
    this.beforeTransactions = beforeTransactions;
    this.transactions = transactions;
    this.afterTransactions = afterTransactions;
  }

  addSigner(signer: Keypair) {
    this.signers.push(signer);
  }

  addBeforeTransaction(transaction: Transaction) {
    this.beforeTransactions.push(transaction);
  }

  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction);
  }

  addAfterTransaction(transaction: Transaction) {
    this.afterTransactions.push(transaction);
  }

  toTransactions() {
    return [...this.beforeTransactions, ...this.transactions, ...this.afterTransactions];
  }

  toInstructions() {
    return this.toTransactions().flatMap((t) => t.instructions);
  }
}


/**
 * Parameters for {@link placeBid}s
 */
export interface PlaceBidParams {
  connection: Connection;
  /** The wallet from which tokens will be taken and transferred to the {@link bidderPotToken} account **/
  wallet: Wallet;
  /** The {@link Auction} program account address for the bid **/
  auction: PublicKey;
  /** Associated token account for the bidder pot **/
  bidderPotToken?: PublicKey;
  /** Amount of tokens (accounting for decimals) or lamports to bid. One important nuance to remember is that each token mint has a different amount of decimals, which need to be accounted while specifying the amount. For instance, to send 1 token with a 0 decimal mint you would provide `1` as the amount, but for a token mint with 6 decimals you would provide `1000000` as the amount to transfer one whole token **/
  amount: BN;
  commitment?: Commitment;
}

export interface PlaceBidResponse {
  txId: TransactionSignature;
  bidderPotToken: PublicKey;
  bidderMeta: PublicKey;
}

/**
 * Place a bid by taking it from the provided wallet and placing it in the bidder pot account.
 */
export const placeBid = async ({
  connection,
  wallet,
  amount,
  auction,
}: PlaceBidParams): Promise<PlaceBidResponse> => {
  const bidder = wallet.publicKey;

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);
  const auctionManager = await AuctionManager.getPDA(auction);
  const manager = await AuctionManager.load(connection, auctionManager);

  const {
    data: { tokenMint },
  } = await manager.getAuction(connection);


  const auctionTokenMint = new PublicKey(tokenMint);
  const vault = new PublicKey(manager.data.vault);
  const auctionExtended = await AuctionExtended.getPDA(vault);
  const bidderPot = await BidderPot.getPDA(auction, bidder);
  const bidderMeta = await BidderMetadata.getPDA(auction, bidder);
  
  
  const bidderPotToken = await getBidderPotTokenPDA(bidderPot)

  const accountInfo = await connection.getAccountInfo(bidderPotToken);

  let txBatch = new TransactionsBatch({ transactions: [] });

  //if the user has an existing biddder pot token acct cancel pending bid

  if(accountInfo) {
    txBatch = await getCancelBidTransactions({
      destAccount: null,
      bidder,
      accountRentExempt,
      bidderPot,
      bidderPotToken,
      bidderMeta,
      auction,
      auctionExtended,
      auctionTokenMint,
      vault,
    });
  }

  // create paying account
  const {
    account: payingAccount,
    createTokenAccountTx,
    closeTokenAccountTx,
  } = await createWrappedAccountTxs(connection, bidder, amount.toNumber() + accountRentExempt * 2);
  txBatch.addTransaction(createTokenAccountTx);
  txBatch.addSigner(payingAccount);
  ////

  // transfer authority
  const {
    authority: transferAuthority,
    createApproveTx,
    createRevokeTx,
  } = createApproveTxs({
    account: payingAccount.publicKey,
    owner: bidder,
    amount: amount.toNumber(),
  });
  txBatch.addTransaction(createApproveTx);
  txBatch.addAfterTransaction(createRevokeTx);
  txBatch.addAfterTransaction(closeTokenAccountTx);
  txBatch.addSigner(transferAuthority);
  ////

  // create place bid transaction
  const placeBidTransaction = new PlaceBid(
    { feePayer: bidder },
    {
      bidder,
      bidderToken: payingAccount.publicKey,
      bidderPot,
      bidderPotToken,
      bidderMeta,
      auction,
      auctionExtended,
      tokenMint: auctionTokenMint,
      transferAuthority: transferAuthority.publicKey,
      amount,
      resource: vault,
    },
  );
  txBatch.addTransaction(placeBidTransaction);
  ////

  const txId = await sendTransaction({
    connection,
    wallet,
    txs: txBatch.toTransactions(),
    signers: txBatch.signers,
  });

  return { txId, bidderPotToken, bidderMeta };
};


/**
 * Parameters for {@link cancelBid}
 */
 export interface CancelBidParams {
  connection: Connection;
  /** Wallet of the original bidder **/
  wallet: Wallet;
  /** Program account of the auction for the bid to be cancelled **/
  auction: PublicKey;
  /** The bidders token account they'll receive refund with **/
  destAccount?: PublicKey;
}

export interface CancelBidResponse {
  txId: string;
}

/**
 * Cancel a bid on a running auction. Any bidder can cancel any time during an auction, but only non-winners of the auction can cancel after it ends. When users cancel, they receive full refunds.
 */
export const cancelBid = async ({
  connection,
  wallet,
  auction,
  destAccount,
}: CancelBidParams): Promise<CancelBidResponse> => {
  const bidder = wallet.publicKey;
  const auctionManager = await AuctionManager.getPDA(auction);
  const manager = await AuctionManager.load(connection, auctionManager);
  const {
    data: { tokenMint },
  } = await manager.getAuction(connection);

  const auctionTokenMint = new PublicKey(tokenMint);
  const vault = new PublicKey(manager.data.vault);
  const auctionExtended = await AuctionExtended.getPDA(vault);
  const bidderPot = await BidderPot.getPDA(auction, bidder);
  const bidderMeta = await BidderMetadata.getPDA(auction, bidder);
  const bidderPotToken = await getBidderPotTokenPDA(bidderPot)

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);
  const txBatch = await getCancelBidTransactions({
    destAccount,
    bidder,
    accountRentExempt,
    bidderPot,
    bidderPotToken,
    bidderMeta,
    auction,
    auctionExtended,
    auctionTokenMint,
    vault,
  });

  const txId = await sendTransaction({
    connection,
    wallet,
    txs: txBatch.toTransactions(),
    signers: txBatch.signers,
  });

  return { txId };
};


const auctionStates = ['created', 'started', 'ended'] as const;
export type AuctionState = typeof auctionStates[number];

export type USMBidData = {
  bidder: string;
  bid: number;
  timestamp: number;
  hasBeenRedeemed?: boolean;
  hasRedeemedParticipationToken?: boolean;
  hasBeenRefunded?: boolean;
  won?: boolean;
};

export type NftData = {
  pubKey: PublicKey;
  metadata: any;
};

export type USMAuctionData = {
  pubkey: PublicKey;
  auctionNft: NftData;
  participationNft?: NftData;
  acceptedToken: PublicKey;
  endTimestamp?: EpochTimeStamp;
  state: AuctionState;
  bids: USMBidData[];
};


export const transformAuctionData = async (
  auction: Auction,
  connection: Connection,
  bidder: PublicKey
): Promise<USMAuctionData | undefined> => {
  const auctionManagerPk = await AuctionManager.getPDA(auction.pubkey);
  const auctionManager = await AuctionManager.load(connection, auctionManagerPk);
  const vault = await Vault.load(connection, new PublicKey(auctionManager.data.vault));
  const boxes = await vault.getSafetyDepositBoxes(connection);

  // The primary NFT will not always be the first in the array of boxes. Maybe "order" will be reliable?
  // The participation NFT, *I think*, is the one with the highest order (you can have > 1 non-participation NFTs)
  const primaryBox = boxes.find((box) => box.data.order === 0);
  const participationBox = boxes.find((box) => box.data.order === Math.min(1, boxes.length - 1));

  if (!primaryBox) {
    return;
  }

  const nftPubKey = primaryBox.data.tokenMint;
  const nftData = await getMetadata(new PublicKey(nftPubKey), connection);
  const nftMetadata = await fetch(nftData.uri).then((response) => response.json());

  const participationNftPubKey = participationBox?.data.tokenMint;
  const participationData = participationNftPubKey
    ? await getMetadata(new PublicKey(participationNftPubKey), connection)
    : undefined;
  const participationMetadata = participationData
    ? await fetch(participationData.uri).then((response) => response.json())
    : undefined;

  const auctionState = auction.data.state;
  const maxWinners = auction.data.bidState.max.toNumber();
  const bids = await auction.getBidderMetadata(connection);


  //get redemption ticket for user
  const bidderRedemptionTicket = await getBidRedemptionTicket(connection, new PublicKey(auction.pubkey), bidder);

  const usmBidData = bids
    .filter((bid) => !isCancelledBid(bid.data, auctionState))
    .sort((a, b) => b.data.lastBid.toNumber() - a.data.lastBid.toNumber())
    .map(({ data }, index) => {
      const bidData: USMBidData = {
        bidder: data.bidderPubkey,
        bid: data.lastBid.toNumber() / LAMPORTS_PER_SOL,
        timestamp: data.lastBidTimestamp.toNumber() * 1000
      };

      if (auctionState === AuctionStateEnum.Ended) {

        const hasBeenRedeemed = bidder.toBase58() === data.bidderPubkey ? hasRedeemedBid(bidderRedemptionTicket, 0) : undefined;
        const hasRedeemedParticipationToken = bidder.toBase58() === data.bidderPubkey ? hasRedeemedBid(bidderRedemptionTicket, Math.min(1, boxes.length - 1)) : undefined;

        return {
          hasBeenRedeemed,
          hasRedeemedParticipationToken,
          hasBeenRefunded: !!data.cancelled,
          won: index < maxWinners,
          ...bidData
        };
      }

      return bidData;
    });

  let endTimestamp;
  if (auctionState === AuctionStateEnum.Ended) {
    endTimestamp = auction.data.endedAt ? auction.data.endedAt.toNumber() * 1000 : undefined;
  } else {
    endTimestamp = auction.data.endAuctionAt
      ? auction.data.endAuctionAt.toNumber() * 1000
      : undefined;
  }

  return {
    pubkey: auction.pubkey,
    auctionNft: {
      pubKey: new PublicKey(nftPubKey),
      metadata: nftMetadata
    },
    participationNft: participationNftPubKey
      ? {
          pubKey: new PublicKey(participationNftPubKey),
          metadata: participationMetadata
        }
      : undefined,
    acceptedToken: new PublicKey(auction.data.tokenMint),
    endTimestamp,
    state: auctionStates[auctionState],
    bids: usmBidData
  };
};

export function isCancelledBid(bidderMetaData: BidderMetadataData, auctionState: AuctionStateEnum) {
  return !!bidderMetaData.cancelled && auctionState !== AuctionStateEnum.Ended;
}

export const getMetadata = async (tokenMint: PublicKey, connection: Connection) => {
  const metadata = await Metadata.getPDA(tokenMint);
  const metadataInfo = await Account.getInfo(connection, metadata);
  const { data } = new Metadata(metadata, metadataInfo).data;
  return data;
};

/**
 * Parameters for {@link claimBid}
 */
 export interface ClaimBidParams {
  connection: Connection;
  /** Wallet of the bidder the bid that is being cancelled belongs to **/
  wallet: Wallet;
  /** The address of the auction program account for the bid that is being cancelled **/
  auction: PublicKey;
  /** The address of the store the auction manager the bid is being cancelled on belongs to **/
  store: PublicKey;
}

export interface ClaimBidResponse {
  txId: string;
}

/**
 * Claim a winning bid as the auctioneer. Pulling money out of the auction contract as an auctioneer can only be done after an auction has ended and must be done for each winning bid, one after the other.
 */
export const claimBid = async ({
  connection,
  wallet,
  store,
  auction,
}: ClaimBidParams): Promise<ClaimBidResponse> => {
  // get data for transactions
  const bidder = wallet.publicKey;
  const auctionManager = await AuctionManager.getPDA(auction);
  const manager = await AuctionManager.load(connection, auctionManager);
  const vault = new PublicKey(manager.data.vault);
  const {
    data: { tokenMint },
  } = await Auction.load(connection, auction);
  const acceptPayment = new PublicKey(manager.data.acceptPayment);
  const auctionExtended = await AuctionExtended.getPDA(vault);
  const auctionTokenMint = new PublicKey(tokenMint);
  const bidderPot = await BidderPot.getPDA(auction, bidder);
  const bidderPotToken = await getBidderPotTokenPDA(bidderPot)

  ////

  const txBatch = await getClaimBidTransactions({
    auctionTokenMint,
    bidder,
    store,
    vault,
    auction,
    auctionExtended,
    auctionManager,
    acceptPayment,
    bidderPot,
    bidderPotToken,
  });

  const txId = await sendTransaction({
    connection,
    wallet,
    txs: txBatch.toTransactions(),
    signers: txBatch.signers,
  });

  return { txId };
};

interface IClaimBidTransactionsParams {
  bidder: PublicKey;
  bidderPotToken?: PublicKey;
  bidderPot: PublicKey;
  auction: PublicKey;
  auctionExtended: PublicKey;
  auctionTokenMint: PublicKey;
  vault: PublicKey;
  store: PublicKey;
  auctionManager: PublicKey;
  acceptPayment: PublicKey;
}

export const getClaimBidTransactions = async ({
  bidder,
  auctionTokenMint,
  store,
  vault,
  auction,
  auctionManager,
  auctionExtended,
  acceptPayment,
  bidderPot,
  bidderPotToken,
}: IClaimBidTransactionsParams) => {
  const txBatch = new TransactionsBatch({ transactions: [] });

  // create claim bid
  const claimBidTransaction = new ClaimBid(
    { feePayer: bidder },
    {
      store,
      vault,
      auction,
      auctionExtended,
      auctionManager,
      bidder,
      tokenMint: auctionTokenMint,
      acceptPayment,
      bidderPot,
      bidderPotToken,
    },
  );
  txBatch.addTransaction(claimBidTransaction);
  ////

  return txBatch;
};



export const loadKeypair = (keypair: string) => {
  if (!keypair || keypair == '') {
      throw new Error('Keypair is required!');
  }
  const keypairPath = keypair.startsWith("~/") ? path.resolve(process.env.HOME, keypair.slice(2)) : path.resolve(keypair);
  const loaded = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairPath).toString())),
  );
  return loaded;
}