import { PublicKey } from '@solana/web3.js';
import { NodeWallet, Connection, actions } from '@metaplex/js';
import { Auction, AuctionExtended, AuctionState, BidderPot } from '@metaplex-foundation/mpl-auction';
import { isWinner } from '../utils/utils';
import { TransactionsBatch } from '../../../ts/src/utils/utils';
import { AuctionManager, ClaimBid } from '@metaplex-foundation/mpl-metaplex';

const { sendTransaction } = actions;

/**
 * Parameters for {@link claimBid}
 */
export interface ClaimBidParams {
  connection: Connection;
  wallet: NodeWallet;
  auction: PublicKey;
  store: PublicKey;
  bidder: PublicKey;
}

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

export interface ClaimBidResponse {
  txId: string;
}

/**
 * As the auctioneer, allows you to claim the winning bid.
 * This must be called for each winning bid after the auction has ended.
 * It will take funds out from the auction and into the auction manager.
 */
export const claimBid = async ({
  connection,
  wallet,
  store,
  auction: auctionPk,
  bidder: bidderPk,
}: ClaimBidParams): Promise<ClaimBidResponse> => {
  const auction = await Auction.load(connection, auctionPk);
  if (auction.data.state !== AuctionState.Ended) {
    throw new Error(`This auction has not ended yet.`);
  }

  const auctionManagerPk = await AuctionManager.getPDA(auctionPk);
  const auctionManager = await AuctionManager.load(connection, auctionManagerPk);
  const bidderIsWinner = isWinner(auction.data, bidderPk);
  
  if (!bidderIsWinner) {
    throw new Error(`Bidder is not a winner on this auction. You can not claim their bid.`);
  }

  const vault = new PublicKey(auctionManager.data.vault);
  const {
    data: { tokenMint },
  } = await Auction.load(connection, auctionPk);
  const acceptPayment = new PublicKey(auctionManager.data.acceptPayment);
  const auctionExtended = await AuctionExtended.getPDA(vault);
  const auctionTokenMint = new PublicKey(tokenMint);
  const bidderPotPk = await BidderPot.getPDA(auctionPk, bidderPk);
  const bidderPot = await BidderPot.load(connection, bidderPotPk);
  const bidderPotToken = new PublicKey(bidderPot.data.bidderPot);

  const txBatch = await getClaimBidTransactions({
    auctionTokenMint,
    bidder: bidderPk,
    store,
    vault,
    auction: auctionPk,
    auctionExtended,
    auctionManager: auctionManagerPk,
    acceptPayment,
    bidderPot: bidderPotPk,
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
  return txBatch;
};
