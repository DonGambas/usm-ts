
/*
This script is meant to be used for testing purposes, it allows you to get a metaplex auction into a 
started state with a primary token transfer only nft and a participation nft. After the auction is started
you can use the simulateAuction.ts script to test different outcomes of the live auction.

This will start an auction with the auctionNftMetadata used to create the primary auction NFT and the 
participationNftMetadata used to create the participation NFT

This calls the cli directly, if you want to change any configs that aren't natively handled by the CLI
commands feel free to update the CLI code

*/


import { execSync } from 'child_process';
import {PublicKey} from "@solana/web3.js";
import 'dotenv/config'

let storeId;
let vaultPubKey;
let auctionPubKey;
let vaultPriceMintPubKey;
let auctionNftPubKey;
let participationNftPubKey;
let auctionTokenStore;
let participationTokenStore

//metadata for NFTs

const auctionNftMetadata = "https://arweave.net:443/ZvkmQOAlk0HBbR50C-rRS3OlMmUtmxfpEdYcsGi4viA";
const paricipationNFtMetadata = "https://arweave.net:443/x6znTwvmKxPXxDVjkNEVvSlGa8qLvjwzX3z4_WAeev4";

const execute = (command, args) => {
  return execSync(`npx ts-node src/usm-cli.ts ${command} ${args}`).toString();
};


const startAuction = async() =>{


  console.log('...processing')
  const args = process.argv.slice(2)

  // initialize store

  console.log('...initializing store')

  const storeResult = execute("init-store", `-k ${process.env.KEYPAIR_DEVNET}`)
  const storeKey = storeResult.trim().split(' ')[2];
  storeId = new PublicKey(storeKey)

  //set white list creator

  console.log('...setting white list creator')

  execute("set-whitelist-creator", `${storeId} -k ${process.env.KEYPAIR_DEVNET}`)

  //create vault

  console.log('...creating vault')

  const vaultResult = execute("create-vault", `-k ${process.env.KEYPAIR_DEVNET}`)
  const parsedResult = vaultResult.trim().split(/\s+/)
  const priceMint = parsedResult[3];
  const vault = parsedResult[6]
  vaultPriceMintPubKey = new PublicKey(priceMint)
  vaultPubKey = new PublicKey(vault);

  // mint auction nft

  console.log('...minting auction nft')

  const auctionNftResult  = execute("mint-nft", `${auctionNftMetadata} -k ${process.env.KEYPAIR_DEVNET}`)
  const auctionNftKey = auctionNftResult.trim().split(' ')[2];
  auctionNftPubKey = new PublicKey(auctionNftKey)

  // mint participation nft

  console.log('...minting participation nft')

  const participationNftResult  =  execute("mint-nft", `${paricipationNFtMetadata} -k ${process.env.KEYPAIR_DEVNET} --participation`)
  const participationNftKey = participationNftResult.trim().split(' ')[3];
  participationNftPubKey = new PublicKey(participationNftKey)

  //add nfts to vault

  console.log('...adding nfts to vault')

  const resultA  = execute("add-nft-to-vault", `${auctionNftPubKey.toBase58()} ${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)
  const resultP  = execute("add-nft-to-vault", `${participationNftPubKey.toBase58()} ${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

  // close vault

  console.log('...closing vault')

  execute("close-vault", `${vaultPubKey.toBase58()} ${vaultPriceMintPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

  const auctionTokenStoreKey = resultA.trim().split(/\s+/)[9]
  const participationTokenStoreKey = resultP.trim().split(/\s+/)[9]

  auctionTokenStore = new PublicKey(auctionTokenStoreKey)
  participationTokenStore = new PublicKey(participationTokenStoreKey)

  // init auction

  console.log('...initialzing auction')

  const initAuctResult = execute("init-auction", `${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)
  const auction = initAuctResult.trim().split(' ')[2];
  auctionPubKey = new PublicKey(auction)

  // init auction manager

  console.log('...initialzing auction managers')

  execute("init-auction-manager", `${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

  // validate auction manager

  console.log('...validating auction manager')

  execute("validate-auction-manager", `${vaultPubKey.toBase58()} ${auctionNftPubKey.toBase58()} ${auctionTokenStore.toBase58()} -p ${participationNftPubKey.toBase58()} -pts ${participationTokenStore.toBase58()} -k ${process.env.KEYPAIR_DEVNET}`)

  // start auction

  console.log('...starting auction managers')

  execute("start-auction", `${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

  console.log("auction started")
  console.log("vault pub key", vaultPubKey.toBase58())
  console.log("vault price mint pub key", vaultPriceMintPubKey.toBase58())
  console.log("auction nft pub key", auctionNftPubKey.toBase58())
  console.log("participation nft pub key", participationNftPubKey.toBase58())
  console.log("auction token store pub key", auctionTokenStore.toBase58())
  console.log("participation token store pub key", participationTokenStore.toBase58())
  console.log("auction pub key", auctionPubKey.toBase58())

}

startAuction()


