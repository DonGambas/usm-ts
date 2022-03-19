import { 
  clusterApiUrl, 
  Connection, 
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import BN from 'bn.js';
import { assert } from "chai";
import { loadKeypair, getOriginalLookupPDA} from "../src/utils/utils"
import { NodeWallet, actions } from '@metaplex/js';
import { Token, TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import { ValidateSafetyDepositBoxV2 } from '../src/utils/validateSafetyDepositBoxV2';
import {USMClient} from "usm-js";

const {initStoreV2, createExternalPriceAccount, createVault, initAuction, addTokensToVault, mintNFT, closeVault, claimBid} = actions;

import {
  MasterEdition,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata';

import {  
  Auction,
  AuctionExtended,
  SetAuctionAuthority,
  WinnerLimit, 
  WinnerLimitType,
  PriceFloor,
  PriceFloorType
} from '@metaplex-foundation/mpl-auction';

import {
  Store,
  WhitelistedCreator,
  SetWhitelistedCreator,
  AuctionManager,
  AuctionWinnerTokenTypeTracker,
  InitAuctionManagerV2,
  StartAuction,
  EndAuction,
  SafetyDepositConfig,
} from '@metaplex-foundation/mpl-metaplex';

import {
  SetVaultAuthority,
  SafetyDepositBox,
} from '@metaplex-foundation/mpl-token-vault';

import { 
  AmountRange, 
  ParticipationStateV2, 
  ParticipationConfigV2,
  SafetyDepositConfigData, 
  NonWinningConstraint,
  WinningConfigType, 
  WinningConstraint } from '../src/utils/SafetyDepositConfig';

import { TupleNumericType, Transaction } from '@metaplex-foundation/mpl-core';
import { isTypedArray } from "util/types";


const auctionNftMetadata = "https://arweave.net:443/ZvkmQOAlk0HBbR50C-rRS3OlMmUtmxfpEdYcsGi4viA";
const paricipationNFtMetadata = "https://arweave.net:443/x6znTwvmKxPXxDVjkNEVvSlGa8qLvjwzX3z4_WAeev4";


describe('auction', () => {

  let connection;
  let wallet: NodeWallet;
  let bidder1: NodeWallet;
  let bidder2: NodeWallet;
  let vault;
  let auctionPubKey;
  let vaultPriceMint;
  let auctionNftPubKey;
  let participationNftPubKey;
  let auctionTokenStore;
  let participationTokenStore

  before(async()=>{
    const bidder1WalletKeypair = Keypair.generate()
    const bidder2WalletKeypair = Keypair.generate()


    connection = new Connection(clusterApiUrl("devnet"));
    wallet = new NodeWallet(loadKeypair(process.env.KEYPAIR_DEVNET))
    bidder1 = new NodeWallet(bidder1WalletKeypair);
    bidder2 = new NodeWallet(bidder2WalletKeypair);

    await connection.confirmTransaction( await connection.requestAirdrop(bidder1.publicKey, 2 * LAMPORTS_PER_SOL))

    await connection.confirmTransaction( await connection.requestAirdrop(bidder2.publicKey, 2 * LAMPORTS_PER_SOL))
    
    //await connection.confirmTransaction( await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL))
  })

  it("it should create a vault", async ()=>{

    const {txId, externalPriceAccount, priceMint} = await createExternalPriceAccount({connection, wallet})
    vaultPriceMint = priceMint;

    // await createExternalPriceAccount to succeed before creating vault
    await connection.confirmTransaction(txId);
    const result = await createVault({connection, wallet, externalPriceAccount, priceMint})
    vault = result.vault
    //console.log("vault created successfully key = ", vault.toBase58())
    //console.log("price mint = ", priceMint.toBase58())
  })

  it("it should create auction NFT", async ()=>{

    const result  = await mintNFT({connection, wallet, uri: auctionNftMetadata, maxSupply: 1})

    auctionNftPubKey = result.mint;

    await connection.confirmTransaction(result.txId);

    //console.log(`auction nft created, pub key = ${auctionNftPubKey.toBase58()}`)
  })


  it("it should create participation NFT", async ()=>{

    const result  = await mintNFT({connection, wallet, uri: paricipationNFtMetadata, maxSupply: null})

    participationNftPubKey = result.mint;

    await connection.confirmTransaction(result.txId);

    //console.log(`auction nft created, pub key = ${auctionNftPubKey.toBase58()}`)
  })

  it("should deposit NFTs into vault and close vault", async ()=>{

    const auctionNft = new Token(connection, auctionNftPubKey, TOKEN_PROGRAM_ID, wallet.payer);
    const participationNft = new Token(connection, participationNftPubKey, TOKEN_PROGRAM_ID, wallet.payer);

    const userAuctionNftAccountInfo = await auctionNft.getOrCreateAssociatedAccountInfo(wallet.publicKey);
    const userParticipationNftAccountInfo = await participationNft.getOrCreateAssociatedAccountInfo(wallet.publicKey);

    //add nfts to vault

    const {safetyDepositTokenStores} = await addTokensToVault({
        connection, wallet, vault, nfts: [
          {tokenAccount: userAuctionNftAccountInfo.address, tokenMint: auctionNftPubKey, amount: new BN(1)},
          {tokenAccount: userParticipationNftAccountInfo.address, tokenMint: participationNftPubKey, amount: new BN(1)}
        ]
      })

     auctionTokenStore = safetyDepositTokenStores[0].tokenStoreAccount;
     participationTokenStore = safetyDepositTokenStores[1].tokenStoreAccount

     connection.confirmTransaction(safetyDepositTokenStores[0].txId)
     connection.confirmTransaction(safetyDepositTokenStores[1].txId)

    await closeVault({connection, wallet, vault: vault, priceMint: vaultPriceMint})


    //console.log(`nft succesfully added to vault ${vault}`)
  })


  it("should init auction", async ()=>{


    // should test different tick sizes, gap tick size percent at end

    const minPrice = 0;
  
    const auctionSettings = {
      instruction: 1,
      tickSize: null,
      auctionGap: null,
      endAuctionAt: null,
      gapTickSizePercentage: null,
      resource: vault,
      winners: new WinnerLimit({
        type: WinnerLimitType.Capped,
        usize: new BN(1),
      }),
      tokenMint: NATIVE_MINT.toBase58(),
      priceFloor: new PriceFloor({ 
          type: Number(minPrice * LAMPORTS_PER_SOL) > 0 ? PriceFloorType.Minimum : PriceFloorType.None,
          minPrice: new BN(minPrice * LAMPORTS_PER_SOL)
        }),
    };

    const {txId, auction} = await initAuction({connection, wallet, vault: vault, auctionSettings})

    auctionPubKey = auction;

    await connection.confirmTransaction(txId)

    const auctionInstance = await Auction.load(connection, auction);
    //console.log("auction created at", auctionInstance.pubkey.toBase58())
  })

  it("should init auction manager", async ()=>{

    const storeId = await Store.getPDA(wallet.publicKey);
    const auctionPDA = await Auction.getPDA(vault);
    const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);
    const tokenTrackerPDA = await AuctionWinnerTokenTypeTracker.getPDA(auctionManagerPDA);

    const nativeMint = new Token(connection, NATIVE_MINT, TOKEN_PROGRAM_ID, wallet.payer);
    const paymentAccount = await nativeMint.createAccount(auctionManagerPDA);

    const initAuctionManagerTx = new InitAuctionManagerV2(
        { feePayer: wallet.publicKey },
        {
            store: storeId,
            vault: vault,
            auction: auctionPDA,
            auctionManager: auctionManagerPDA,
            auctionManagerAuthority: wallet.publicKey,
            acceptPaymentAccount: paymentAccount,
            tokenTracker: tokenTrackerPDA,
            amountType: TupleNumericType.U8,
            lengthType: TupleNumericType.U8,
            maxRanges: new BN(10),
        },
    );

    const SetVaultAuthorityTx = new SetVaultAuthority(
        { feePayer: wallet.publicKey },
        {
            vault: vault,
            currentAuthority: wallet.publicKey,
            newAuthority: auctionManagerPDA
        }
    )

    const txs = Transaction.fromCombined([initAuctionManagerTx ,SetVaultAuthorityTx ]);

    await sendAndConfirmTransaction(connection, txs, [wallet.payer], {
        commitment: 'confirmed',
    });

    //console.log("auction manager created at", auctionManagerPDA.toBase58(), "vault and auction authority transfered to auction manager")

  })

  it("should validate auction manager", async() =>{
    const storeId = await Store.getPDA(wallet.publicKey);
    const auctionPDA = await Auction.getPDA(vault);
    const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);
    const tokenTrackerPDA = await AuctionWinnerTokenTypeTracker.getPDA(auctionManagerPDA);
    const metadataPDA = await Metadata.getPDA(auctionNftPubKey);
    const editionPDA = await MasterEdition.getPDA(auctionNftPubKey);
    const safetyDepositBox = await SafetyDepositBox.getPDA(vault, auctionNftPubKey);
    const safetyDepositConfig = await SafetyDepositConfig.getPDA(auctionManagerPDA,safetyDepositBox);
    const originalAuthorityLookup = await getOriginalLookupPDA(auctionPDA, metadataPDA);
    const whitelistedCreatorPDA = await WhitelistedCreator.getPDA(storeId, wallet.publicKey);
    
    const safetyDepositConfigData = new SafetyDepositConfigData({
        auctionManager: auctionManagerPDA.toBase58(),
        order: new BN(0),
        winningConfigType: WinningConfigType.TokenOnlyTransfer,
        amountType: TupleNumericType.U8,
        lengthType: TupleNumericType.U8,
        amountRanges: [new AmountRange({amount: new BN(1), length: new BN(1)})],
        participationConfig: null,
        participationState: null
    })

        const aTx = new ValidateSafetyDepositBoxV2(
            {feePayer: wallet.publicKey },
            {   
                store:storeId,
                vault: vault,
                auctionManager: auctionManagerPDA,
                auctionManagerAuthority: wallet.publicKey,
                metadataAuthority: wallet.publicKey, 
                originalAuthorityLookup,
                tokenTracker: tokenTrackerPDA,
                tokenAccount: metadataPDA,
                tokenMint:auctionNftPubKey,
                edition: editionPDA,
                whitelistedCreator: whitelistedCreatorPDA,
                safetyDepositBox,
                safetyDepositTokenStore: auctionTokenStore,
                safetyDepositConfig,
                safetyDepositConfigData
            }
        )

        await sendAndConfirmTransaction(connection, aTx, [wallet.payer], {
            commitment: 'confirmed',
        });
    

    // setup and validate participation nft safety deposit box

        const participationMetadataPDA = await Metadata.getPDA(participationNftPubKey);
        const participationEditionPDA = await MasterEdition.getPDA(participationNftPubKey);
        const participationSafetyDepositBox = await SafetyDepositBox.getPDA(vault, participationNftPubKey);
        const participationSafetyDepositConfig = await SafetyDepositConfig.getPDA(auctionManagerPDA,participationSafetyDepositBox);
        const participationOriginalAuthorityLookup = await getOriginalLookupPDA(auctionPDA, participationMetadataPDA);


    const participationSafetyDepositConfigData = new SafetyDepositConfigData({
        auctionManager: auctionManagerPDA.toBase58(),
        order: new BN(1),
        winningConfigType: WinningConfigType.Participation,
        amountType: TupleNumericType.U8,
        lengthType: TupleNumericType.U8,
        // not sure what amount ranges for participation nft should be given that it depends on num bidderss
        amountRanges: [new AmountRange({amount: new BN(1), length: new BN(1)})],
        participationConfig: new ParticipationConfigV2({
            winnerConstraint:   WinningConstraint.ParticipationPrizeGiven,
            nonWinningConstraint: NonWinningConstraint.GivenForFixedPrice,
            fixedPrice: null
        }),
        participationState: new ParticipationStateV2({
          collectedToAcceptPayment:new BN(0)
        })
    })

        const ptTx = new ValidateSafetyDepositBoxV2(
            {feePayer: wallet.publicKey },
            {   
                store:storeId,
                vault: vault,
                auctionManager: auctionManagerPDA,
                auctionManagerAuthority: wallet.publicKey,
                metadataAuthority: wallet.publicKey, 
                originalAuthorityLookup: participationOriginalAuthorityLookup,
                tokenTracker: tokenTrackerPDA,
                tokenAccount: participationMetadataPDA,
                tokenMint:participationNftPubKey,
                edition: participationEditionPDA,
                whitelistedCreator: whitelistedCreatorPDA,
                safetyDepositBox: participationSafetyDepositBox,
                safetyDepositTokenStore: participationTokenStore,
                safetyDepositConfig: participationSafetyDepositConfig,
                safetyDepositConfigData: participationSafetyDepositConfigData
            }
        )

        await sendAndConfirmTransaction(connection, ptTx, [wallet.payer], {
            commitment: 'confirmed',
        });

        //console.log(`auction manager validated!`)

  })


  it("should start auction", async() => {

    const storeId = await Store.getPDA(wallet.publicKey);
    const auctionPDA = await Auction.getPDA(vault);
    const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);

    const setAuctionAuthorityTx = new SetAuctionAuthority(
        { feePayer: wallet.publicKey },
        {
            auction: auctionPDA,
            currentAuthority: wallet.publicKey,
            newAuthority: auctionManagerPDA
        }
    )

    await sendAndConfirmTransaction(connection, setAuctionAuthorityTx, [wallet.payer], {
        commitment: 'confirmed',
      });

    const tx = new StartAuction(
      { feePayer: wallet.publicKey },
      {
        store: storeId,
        auction: auctionPDA,
        auctionManager: auctionManagerPDA,
        auctionManagerAuthority: wallet.publicKey,
      },
    );

    await sendAndConfirmTransaction(connection, tx, [wallet.payer], {
      commitment: 'confirmed',
    });

  })

  /*it("should place bid from bidder 1", async()=>{

    const USM = new USMClient(connection, bidder1);
    await USM.placeBid(new BN(.25 * LAMPORTS_PER_SOL), auctionPubKey);

  })

  it("should place bid from bidder 2", async()=>{

    const USM = new USMClient(connection, bidder2);
    await USM.placeBid(new BN(.30 * LAMPORTS_PER_SOL), auctionPubKey);

  })*/

})