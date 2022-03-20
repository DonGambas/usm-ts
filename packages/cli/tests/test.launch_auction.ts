import { 
  clusterApiUrl, 
  Connection, 
  LAMPORTS_PER_SOL,
  Keypair,
  PublicKey
} from "@solana/web3.js";
import { execSync } from 'child_process';
import { loadKeypair} from "../src/utils/utils"
import { NodeWallet } from '@metaplex/js';


const auctionNftMetadata = "https://arweave.net:443/ZvkmQOAlk0HBbR50C-rRS3OlMmUtmxfpEdYcsGi4viA";
const paricipationNFtMetadata = "https://arweave.net:443/x6znTwvmKxPXxDVjkNEVvSlGa8qLvjwzX3z4_WAeev4";


const test = (command, args) => {
  return execSync(`npx ts-node src/usm-cli.ts ${command} ${args}`).toString();
};


describe('auction', () => {

  let connection;
  let wallet: NodeWallet;
  let bidder1: NodeWallet;
  let bidder2: NodeWallet;
  let storeId;
  let vaultPubKey;
  let auctionPubKey;
  let vaultPriceMintPubKey;
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

  it("it should initialize a store", async ()=>{


    const result = test("init-store", `-k ${process.env.KEYPAIR_DEVNET}`)
    const storeKey = result.trim().split(' ')[2];
    storeId = new PublicKey(storeKey)
    
  })

  it("it should set current wallet as whitelisted creator", async ()=>{

    const result = test("set-whitelist-creator", `${storeId} -k ${process.env.KEYPAIR_DEVNET}`)
    
  })

  it("it should create a vault", async ()=>{

    const result = test("create-vault", `-k ${process.env.KEYPAIR_DEVNET}`)
    const parsedResult = result.trim().split(/\s+/)
    const priceMint = parsedResult[3];
    const vault = parsedResult[6]
    vaultPriceMintPubKey = new PublicKey(priceMint)
    vaultPubKey = new PublicKey(vault);
    
  })

*it("it should create auction NFT", async ()=>{

    const result  = test("mint-nft", `${auctionNftMetadata} -k ${process.env.KEYPAIR_DEVNET}`)
    const auctionNftKey = result.trim().split(' ')[2];
    auctionNftPubKey = new PublicKey(auctionNftKey)

  })


  it("it should create participation NFT", async ()=>{

    const result  =  test("mint-nft", `${paricipationNFtMetadata} -k ${process.env.KEYPAIR_DEVNET} --participation`)
    const participationNftKey = result.trim().split(' ')[3];
    participationNftPubKey = new PublicKey(participationNftKey)

  })

  it("should deposit NFTs into vault and close vault", async ()=>{

    //add nfts to vault

    const resultA  = test("add-nft-to-vault", `${auctionNftPubKey.toBase58()} ${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)
    const resultP  = test("add-nft-to-vault", `${participationNftPubKey.toBase58()} ${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

    // close vault

    test("close-vault", `${vaultPubKey.toBase58()} ${vaultPriceMintPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

    const auctionTokenStoreKey = resultA.trim().split(/\s+/)[9]
    const participationTokenStoreKey = resultP.trim().split(/\s+/)[9]
 
    auctionTokenStore = new PublicKey(auctionTokenStoreKey)
    participationTokenStore = new PublicKey(participationTokenStoreKey)

  })


  it("should init auction", async ()=>{

    const result = test("init-auction", `${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)
    const auction = result.trim().split(' ')[2];
    auctionPubKey = new PublicKey(auction)


  })

  it("should init auction manager", async ()=>{

    test("init-auction-manager", `${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)
 
  })

  it("should validate auction manager", async ()=>{

     test("validate-auction-manager", `${vaultPubKey.toBase58()} ${auctionNftPubKey.toBase58()} ${auctionTokenStore.toBase58()} -p ${participationNftPubKey.toBase58()} -pts ${participationTokenStore.toBase58()} -k ${process.env.KEYPAIR_DEVNET}`)

    //assert.equal(result, 'auction manager validated!')

  })

  it("should start auction", async ()=>{

    test("start-auction", `${vaultPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

  })

  it("should end auction", async ()=>{

    test("end-auction", `${auctionPubKey.toBase58()}  -k ${process.env.KEYPAIR_DEVNET}`)

  })

/*


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
        commitment: 'finalized',
    });

    //console.log("auction manager created at", auctionManagerPDA.toBase58(), "vault and auction authority transfered to auction manager")

  })

  it("should validate auction manager", async() =>{
    const storeId = await Store.getPDA(wallet.publicKey);
    const auctionPDA = await Auction.getPDA(vault);
    const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);
    const tokenTrackerPDA = await AuctionWinnerTokenTypeTracker.getPDA(auctionManagerPDA);
    const whitelistedCreatorPDA = await WhitelistedCreator.getPDA(storeId, wallet.publicKey);



        // setup and validate participation nft safety deposit box

        const participationMetadataPDA = await Metadata.getPDA(participationNftPubKey);
        const participationEditionPDA = await MasterEdition.getPDA(participationNftPubKey);
        const participationSafetyDepositBox = await SafetyDepositBox.getPDA(vault, participationNftPubKey);
        const participationSafetyDepositConfig = await SafetyDepositConfig.getPDA(auctionManagerPDA,participationSafetyDepositBox);
        const participationOriginalAuthorityLookup = await getOriginalLookupPDA(auctionPDA, participationMetadataPDA);


    const participationSafetyDepositConfigData = new SafetyDepositConfigData({
        auctionManager: auctionManagerPDA.toBase58(),
        order: new BN(0),
        winningConfigType: WinningConfigType.Participation,
        amountType: TupleNumericType.U8,
        lengthType: TupleNumericType.U8,
        // not sure what amount ranges for participation nft should be given that it depends on num bidderss
        amountRanges: [new AmountRange({amount: new BN(1), length: new BN(1)})],
        participationConfig: new ParticipationConfigV2({
            winnerConstraint:   WinningConstraint.ParticipationPrizeGiven,
            nonWinningConstraint: NonWinningConstraint.GivenForFixedPrice,
            fixedPrice: new BN(0)
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
            commitment: 'finalized',
        });





    const metadataPDA = await Metadata.getPDA(auctionNftPubKey);
    const editionPDA = await MasterEdition.getPDA(auctionNftPubKey);
    const safetyDepositBox = await SafetyDepositBox.getPDA(vault, auctionNftPubKey);
    const safetyDepositConfig = await SafetyDepositConfig.getPDA(auctionManagerPDA,safetyDepositBox);
    const originalAuthorityLookup = await getOriginalLookupPDA(auctionPDA, metadataPDA);
    
    const safetyDepositConfigData = new SafetyDepositConfigData({
        auctionManager: auctionManagerPDA.toBase58(),
        order: new BN(1),
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
            commitment: 'finalized',
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
        commitment: 'finalized',
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
      commitment: 'finalized',
    });

  })

  it("should place bid from bidder 1", async()=>{

    const USM = new USMClient(connection, bidder1);
    const bidder1BalPre = await connection.getBalance(bidder1.publicKey)
    console.log("bidder 1 balance pre", bidder1BalPre)
    await USM.placeBid(new BN(.25 * LAMPORTS_PER_SOL), auctionPubKey);
    const bidder1BalPost = await connection.getBalance(bidder1.publicKey)
    console.log("bidder 1 balance post", bidder1BalPost);

  })

  it("should place bid from bidder 2", async()=>{

    const USM = new USMClient(connection, bidder2);
    const bidder2BalPre = await connection.getBalance(bidder2.publicKey)
    console.log("bidder 2 balance pre", bidder2BalPre)
    await USM.placeBid(new BN(.30 * LAMPORTS_PER_SOL), auctionPubKey);
    const bidder2BalPost = await connection.getBalance(bidder2.publicKey)
    console.log("bidder 2 balance post", bidder2BalPost);

  })

  it("it should end auction", async()=>{

    const auctionManager = await AuctionManager.getPDA(auctionPubKey);
    const manager = await AuctionManager.load(connection, auctionManager)

    const storeId = await Store.getPDA(wallet.publicKey);
    const auctionPDA = await Auction.getPDA(vault);
    const auctionExtendedPDA = await AuctionExtended.getPDA(vault)
    const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);


    const tx = new EndAuction(
      { feePayer: wallet.publicKey },
      {
          store:storeId,
          auction: auctionPDA,
          auctionExtended:auctionExtendedPDA,
          auctionManager: auctionManagerPDA,
          auctionManagerAuthority: wallet.publicKey
       
      },
    );

    await sendAndConfirmTransaction(connection, tx, [wallet.payer], {
      commitment: 'finalized',
    });

    const bidder2Bal = await connection.getBalance(bidder2.publicKey)
    console.log("bidder 2 balance post final", bidder2Bal);
    const bidder1Bal = await connection.getBalance(bidder1.publicKey)
    console.log("bidder 1 balance post final", bidder1Bal);

  })

  it("the winner should be bidder 2", async()=>{

    const USM = new USMClient(connection, bidder2);
    const auctData = await USM.getAuctionData(auctionPubKey);
    assert.equal(auctData.winner.bidder.toBase58(), bidder2.publicKey.toBase58())


  })

  it("in should claim bid for auctioneer", async()=>{

    const storeId = await Store.getPDA(wallet.publicKey);
    const wSol = new Token(connection, NATIVE_MINT, TOKEN_PROGRAM_ID, wallet.payer);
    const {txId} = await claimBid({connection, wallet, store: storeId, auction: auctionPubKey})
    connection.confirmTransaction(txId);
  
  })


  it("participant should redeem participation nft", async()=>{

    const storeId = await Store.getPDA(wallet.publicKey);
    const USM = new USMClient(connection, bidder1);
    await USM.redeemParticipationBid(storeId, auctionPubKey);

  
  })*/

})