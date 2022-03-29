
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
import {Store} from "@metaplex-foundation/mpl-metaplex";

import {redeemTokenOnlyBid} from "../src/utils/redeemTokenOnlyBid"
import {redeemParticipationBid} from "../src/utils/redeemParticipationBid"
import { claimBid } from '../../ts/src/utils/utils';

const execute = (command, args) => {
  return execSync(`npx ts-node src/usm-cli.ts ${command} ${args}`).toString();
};


const simulateAuction = async() =>{


  const args = process.argv.slice(2)

  const auctionPubKey = new PublicKey(args[0])
  const participationPubKey = new PublicKey(args[1])

  const wallet = new NodeWallet(loadKeypair(process.env.KEYPAIR_DEVNET))
  const bidder1 = new NodeWallet(loadKeypair(process.env.TEST_BIDDER_1));
  const bidder2 = new NodeWallet(loadKeypair(process.env.TEST_BIDDER_2));
  const connection = new Connection(clusterApiUrl("devnet"));


  // get sol balances before bid
  const balBidder1Pre = await connection.getBalance(bidder1.publicKey)
  const balBidder2Pre = await connection.getBalance(bidder2.publicKey)


  //place bids from bidder 1 and 2
  const USM1 = new USMClient(connection, bidder1);
  await USM1.placeBid(new BN(.26 * LAMPORTS_PER_SOL), auctionPubKey);
  const USM2 = new USMClient(connection, bidder2);
  await USM2.placeBid(new BN(.31 * LAMPORTS_PER_SOL), auctionPubKey);

  
 // end auctions
  execute("end-auction", `${auctionPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

  // get store id

  const storeId = await Store.getPDA(wallet.publicKey);

  //redeem prizes

  // redeem participation bid
  await redeemParticipationBid({connection, wallet: bidder1, store: storeId, auction: auctionPubKey})

  // redeem token only bid
  await redeemTokenOnlyBid({connection, wallet: bidder2, store: storeId, auction: auctionPubKey})
  console.log("winner redeem winning prize")

  // look at updated token balances

  const participationToken = new Token(connection, participationPubKey, TOKEN_PROGRAM_ID, wallet.payer)
  const bidder1ParticipationBidAcct = await participationToken.getOrCreateAssociatedAccountInfo(bidder1.publicKey)
  const bidder1ParticipationBal = bidder1ParticipationBidAcct.amount.toNumber()


  // claim bids

  //await claimBid({connection, wallet, store: storeId, auction: auctionPubKey})

}

simulateAuction()