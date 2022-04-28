
/*
This script is meant to test the live state and ended state of an auction. You should use this script
after starting an auction using the startAuction.ts script.

Use this script to place bids on an auction. You can add additional bidders by adding more wallets to 
the .env file and loading them here (eg. TEST_BIDDER_1, TEST_BIDDER_2)

after bidding you can end the auction and redeem participation prize and auction prize. You can also validate
the balances of the bidder wallets to make sure they recieved their nfts.

Note: claim bid is not currently functioning and this script has been a bit brittle.

*/


import { execSync } from 'child_process';
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import BN from "bn.js"
import 'dotenv/config'

import { USMClient } from "../../ts/src/index"
import { loadKeypair} from "../src/utils/utils"
import { NodeWallet } from '@metaplex/js';
import {Store, AuctionManager, BidRedemptionTicket
} from "@metaplex-foundation/mpl-metaplex";
import { BidderMetadata } from '@metaplex-foundation/mpl-auction';
import { getBidRedemptionPDA
 } from '../src/utils/redeemTokenOnlyBid';


import {redeemTokenOnlyBid} from "../src/utils/redeemTokenOnlyBid"
import {redeemParticipationBid} from "../src/utils/redeemParticipationBid"
import { claimBid } from '../../ts/src/utils/utils';

const execute = (command, args) => {
  return execSync(`npx ts-node src/usm-cli.ts ${command} ${args}`).toString();
};

/*const hasWinnerRedeemedTicket = async(connection, auction, bidder) => {
  const bidderMetaPDA = await BidderMetadata.getPDA(auction, bidder);
  const bidRedemptionPDA = await getBidRedemptionPDA(auction, bidderMetaPDA);
  const accountInfo = await connection.getAccountInfo(bidRedemptionPDA);
  const confirmedBidRedemption = await BidRedemptionTicket.load(
    connection,
    bidRedemptionPDA
  );

  console.log(confirmedBidRedemption)
  //const tix = new BidRedemptionTicket(bidRedemptionPDA, accountInfo)
  //console.log(tix);

}*/

const hasRedeemedTicket = async(connection : Connection, auction : PublicKey, bidder: PublicKey, order:number) => {
  const bidderMetaPDA = await BidderMetadata.getPDA(auction, bidder);
  const bidRedemptionPDA = await getBidRedemptionPDA(auction, bidderMetaPDA);
  const accountInfo = await connection.getAccountInfo(bidRedemptionPDA);
  const bidRedemption = new BidRedemptionTicket(bidRedemptionPDA, accountInfo)

  const data = bidRedemption.data.data;

  let offset = 42;
  if (data[1] == 0) {
    offset -= 8;
  }
  const index = Math.floor(order / 8) + offset;
  const positionFromRight = 7 - (order % 8);
  const mask = Math.pow(2, positionFromRight);

  const appliedMask = data[index] & mask;

  return appliedMask != 0;

}

const simulateAuction = async() =>{


  const args = process.argv.slice(2)

  const auctionPubKey = new PublicKey(args[0])
  const participationPubKey = new PublicKey(args[1])

  
  const wallet = new NodeWallet(loadKeypair(process.env.KEYPAIR_DEVNET))
  const bidder1 = new NodeWallet(loadKeypair(process.env.TEST_BIDDER_1));
  const bidder2 = new NodeWallet(loadKeypair(process.env.TEST_BIDDER_2));
  const bidder3 = new NodeWallet(loadKeypair(process.env.TEST_BIDDER_3));
  const connection = new Connection(clusterApiUrl("devnet"));
  const auctionManagerPDA = await AuctionManager.getPDA(auctionPubKey);
  const manager = await AuctionManager.load(connection, auctionManagerPDA);

  console.log("wallet", wallet.publicKey.toBase58())
  console.log("bidder 1", bidder1.publicKey.toBase58())
  console.log("bidder 2", bidder2.publicKey.toBase58())
  console.log("bidder 3", bidder3.publicKey.toBase58())


  // this will return the redemption ticket for the specified bidder
  //console.log(await hasRedeemedTicket(connection,auctionPubKey, bidder3.publicKey, 0))


  // get sol balances before bid
  const balBidder1Pre = await connection.getBalance(bidder1.publicKey)
  const balBidder2Pre = await connection.getBalance(bidder2.publicKey)


  //place bids from bidder 1 and 2
  const USM1 = new USMClient(connection, bidder1);
  await USM1.placeBid(new BN(.26 * LAMPORTS_PER_SOL), auctionPubKey);
  const USM2 = new USMClient(connection, bidder2);
  await USM2.placeBid(new BN(.31 * LAMPORTS_PER_SOL), auctionPubKey);
  const USM3 = new USMClient(connection, bidder3);
  await USM3.placeBid(new BN(.35 * LAMPORTS_PER_SOL), auctionPubKey);

  
 // end auctions
  execute("end-auction", `${auctionPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)
  

  // get store id

  const storeId = await Store.getPDA(wallet.publicKey);

  //redeem prizes

  // redeem participation bid
  const {txIds} = await redeemParticipationBid({connection, wallet: bidder2, store: storeId, auction: auctionPubKey})

  await connection.confirmTransaction(txIds[0])
  await connection.confirmTransaction(txIds[1])


  // redeem token only bid
  const result = await redeemTokenOnlyBid({connection, wallet: bidder3, store: storeId, auction: auctionPubKey})
  console.log("winner redeem winning prize")

  // look at updated token balances

  const participationToken = new Token(connection, participationPubKey, TOKEN_PROGRAM_ID, wallet.payer)
  const bidder1ParticipationBidAcct = await participationToken.getOrCreateAssociatedAccountInfo(bidder3.publicKey)

  const bidder1ParticipationBal = bidder1ParticipationBidAcct.amount.toNumber()

  console.log(bidder1ParticipationBal)


  // claim bids

  //await claimBid({connection, wallet, store: storeId, auction: auctionPubKey})

}

simulateAuction()