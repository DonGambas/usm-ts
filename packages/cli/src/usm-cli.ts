#! /usr/bin/env node

import * as web3 from '@solana/web3.js';
import BN from 'bn.js';
import { NATIVE_MINT, Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import { NodeWallet, actions } from '@metaplex/js';
import { claimBid } from './utils/claimBid';
import { addTokensToVault } from './utils/commands/addTokensToVault';
import { loadKeypair, createMetadataUri, getOriginalLookupPDA, uploadImage  } from "./utils/utils"
import { getKeypair } from './utils/keys';

const { initStoreV2, createExternalPriceAccount, createVault, initAuction, mintNFT, closeVault } = actions;
const { Connection, clusterApiUrl, PublicKey,  sendAndConfirmTransaction } = web3;

import { 
    AmountRange, 
    ParticipationStateV2, 
    ParticipationConfigV2,
    SafetyDepositConfigData, 
    NonWinningConstraint,
    WinningConfigType, 
    WinningConstraint } from './utils/commands/SafetyDepositConfig';

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
    SetVaultAuthority,
    SafetyDepositBox,
  } from '@metaplex-foundation/mpl-token-vault';

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
    MasterEdition,
    Metadata,
  } from '@metaplex-foundation/mpl-token-metadata';

  
  import { ValidateSafetyDepositBoxV2 } from './utils/commands/validateSafetyDepositBoxV2';

  import { TupleNumericType, Transaction } from '@metaplex-foundation/mpl-core';


import { program } from 'commander';

export * from './sign-metadata';

program.version('1.0.0');


program
    .command('init-store')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async (options) => {

        // get values from options

        const { env, keypair } = options;

        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))

        const {storeId} = await initStoreV2({connection, wallet, settingsUri: null, isPublic: false })
        console.log("store initialized", storeId.toBase58())
    
    })
    
program
    .command('set-whitelist-creator')
    .argument('<store>', 'store id')
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .option(
        '-c, --creator <string>',
        'creator adddresss',
    )
    .action(async (store, options) => {

        // get values from options

        const { env, keypair, creator } = options;

        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))
        const {payer} = wallet;
        const storeId = new PublicKey(store)

        const creatorPubKey = creator ? new PublicKey(creator) : payer.publicKey;

        const whitelistedCreatorPDA = await WhitelistedCreator.getPDA(storeId, creatorPubKey);

        const tx = new SetWhitelistedCreator(
            { feePayer: payer.publicKey },
            {
              admin: payer.publicKey,
              store: storeId,
              whitelistedCreatorPDA,
              creator: creatorPubKey,
              activated: true,
            },
          );
          const result = await sendAndConfirmTransaction(connection, tx, [payer], {
            commitment: 'confirmed',
          });

        console.log(`creator ${creatorPubKey} white listed on store ${storeId}`)    
    })

program
    .command('create-vault')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async (options) => {

        // get values from options

        const { env, keypair } = options;

        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))

        const {txId: priceAccountTx, externalPriceAccount, priceMint} = await createExternalPriceAccount({connection, wallet})

        // await createExternalPriceAccount to succeed before creating vault
        await connection.confirmTransaction(priceAccountTx, "finalized");

        const {txId: vaultTx, vault} = await createVault({connection, wallet, externalPriceAccount, priceMint})
        await connection.confirmTransaction(vaultTx, "finalized");

        console.log("price mint created", priceMint.toBase58())
        console.log("vault created", vault.toBase58())
    
    })

    program
    .command('upload-image')
    .requiredOption(
        '-ar, --arwallet <path>',
        'ar wallet path',
        '--arwallet not provided',
    )
    .requiredOption(
    '-i, --image <path>',
    `path to image`,
    '--image-path not provided',
    )
    .action(async (options) => {

        const {image, arwallet} = options;

        return uploadImage({arweaveWallet: arwallet, imagePath: image })

})

    program
        .command('create-metadata-uri')
        .requiredOption(
            '-ar, --arwallet <path>',
            'ar wallet path',
            '--arwallet not provided',
        )
        .requiredOption(
        '-m, --metadata <path>',
        `metadata json location`,
        '--metadata-path not provided',
        )
        .action(async (options) => {

            const {metadata, arwallet} = options;

            return createMetadataUri({arweaveWallet: arwallet, metadataPath: metadata })

    })

    program
    .command('mint-nft')
    .argument('<uri>', 'metadata uri')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .option(
        '--participation', 'use if this is a participation nft'
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
   
    .action(async (uri, options) => {

        const { env, keypair, participation } = options;

        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))

        const {txId, mint} = await mintNFT({connection, wallet, uri, maxSupply: participation ? null: 1})

        await connection.confirmTransaction(txId, "finalized");

        console.log(`${participation ? `participation nft created ${mint.toBase58()}`:`nft created ${mint.toBase58()}`}`)
    })

    program
    .command('add-nft-to-vault')
    .argument('<nft>', 'nft pub key')
    .argument('<vault>', 'vault pub key')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .requiredOption(
        '-t, --tokenkey <string>',
        `token owner wallet key`,
        '--keypair not provided',
    )
    .action(async (nft, vault, options) => {

        const { env, keypair, tokenkey } = options;

    console.log(tokenkey)

        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))
        const tokenOwnerKey = tokenkey ? new PublicKey(tokenkey) : wallet.publicKey;
        const {payer} = wallet;

        const nftMint = new PublicKey(nft);
        const vaultPubKey = new PublicKey(vault);

        const nftToken = new Token(connection, nftMint, TOKEN_PROGRAM_ID, payer);

        const {address} = await nftToken.getOrCreateAssociatedAccountInfo(tokenOwnerKey);

        const {tokenStore
            , tx, signers} = await addTokensToVault({
            connection, wallet, tokenOwnerKey, vault: vaultPubKey, nft: {tokenAccount: address, tokenMint: nftMint, amount: new BN(1)} })

        console.log(`nft succesfully added to vault ${vault}`)
        console.log("token store account ",tokenStore.tokenStoreAccount.toBase58())
        console.log("tx", tx)
        console.log("signers", signers)

    })

    program
    .command('close-vault')
    .argument('<vault>', 'vault pub key')
    .argument('<price_mint>', 'price mint pub key')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async ( vault, price_mint, options) => {

        const { env, keypair } = options;

        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))

        const vaultPubKey = new PublicKey(vault);
        const priceMintPubKey = new PublicKey(price_mint);

        await closeVault({connection, wallet, vault: vaultPubKey, priceMint: priceMintPubKey})

        console.log(`vault ${vault} state moved to combined, ready for init auction`)
 
    })

    
    program
    .command('init-auction')
    .argument('<vault>', 'auction vault')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .option(
        '-m, --minprice <number>',
        `minimum price for auction in SOL`,
        '0',
    )
    .option(
        '-t, --ticksize <number>',
        `tick size`,
    )
    .option(
        '-ag, --auctiongap <number>',
        `auction gap`,
    )
    .option(
        '-g, --gapsize-percent <number>',
        `gap size percent`,
    )
    .option(
        '-et, --endtime <number>',
        `unix timestamp of end time of auction`,
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async (vault, options) => {

        // get values from options

        const { env, keypair, endtime, minprice, ticksize, gapsize, auctiongap } = options;

        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))
        const vaultPubKey = new PublicKey(vault)


        const auctionSettings = {
          instruction: 1,
          tickSize: ticksize ? new BN(ticksize): null ,
          auctionGap: auctiongap ? new BN(auctiongap):null,
          endAuctionAt: endtime ? new BN(endtime): null,
          gapTickSizePercentage: gapsize ? Number(gapsize): null,
          resource: vaultPubKey,
          winners: new WinnerLimit({
            type: WinnerLimitType.Capped,
            usize: new BN(1),
          }),
          tokenMint: NATIVE_MINT.toBase58(),
          priceFloor: new PriceFloor({ 
              type: Number(Number(minprice) * web3.LAMPORTS_PER_SOL) > 0 ? PriceFloorType.Minimum : PriceFloorType.None,
              minPrice: new BN(Number(minprice) * web3.LAMPORTS_PER_SOL)
            }),
        };

        const {txId, auction} = await initAuction({connection, wallet, vault: vaultPubKey, auctionSettings})
        await connection.confirmTransaction(txId, "finalized")

        console.log("auction created", auction.toBase58())
    
    })

    program
        .command('init-auction-manager')
        .argument('<vault>', 'auction vault')
        .option(
            '-e, --env <string>',
            'Solana cluster env name',
            'devnet',
        )
        .requiredOption(
            '-k, --keypair <path>',
            `Solana wallet location`,
            '--keypair not provided',
        )
        .action(async (vault,options) => {

            const { env, keypair } = options;

        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))

        const {payer} = wallet
        const vaultPubKey = new PublicKey(vault)

        const storeId = await Store.getPDA(payer.publicKey);
        const auctionPDA = await Auction.getPDA(vaultPubKey);
        const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);
        const tokenTrackerPDA = await AuctionWinnerTokenTypeTracker.getPDA(auctionManagerPDA);

        const nativeMint = new Token(connection, NATIVE_MINT, TOKEN_PROGRAM_ID, payer);
        const paymentAccount = await nativeMint.createAccount(auctionManagerPDA);

        const initAuctionManagerTx = new InitAuctionManagerV2(
            { feePayer: payer.publicKey },
            {
                store: storeId,
                vault: vaultPubKey,
                auction: auctionPDA,
                auctionManager: auctionManagerPDA,
                auctionManagerAuthority: payer.publicKey,
                acceptPaymentAccount: paymentAccount,
                tokenTracker: tokenTrackerPDA,
                amountType: TupleNumericType.U8,
                lengthType: TupleNumericType.U8,
                maxRanges: new BN(10),
            },
        );

        const SetVaultAuthorityTx = new SetVaultAuthority(
            { feePayer: payer.publicKey },
            {
                vault: vaultPubKey,
                currentAuthority: payer.publicKey,
                newAuthority: auctionManagerPDA
            }
        )

        const txs = Transaction.fromCombined([initAuctionManagerTx ,SetVaultAuthorityTx ]);

        await sendAndConfirmTransaction(connection, txs, [payer, payer], {
            commitment: 'finalized',
        });

        console.log("auction manager created at", auctionManagerPDA.toBase58(), "vault and auction authority transfered to auction manager")

    })

    program
        .command('validate-auction-manager')
        .argument('<vault>', 'auction vault')
        .argument('<nft>', 'nft mint')
        .argument('<token_store>', 'nft token store')
        .option(
            '-e, --env <string>',
            'Solana cluster env name',
            'devnet',
        )
        .option(
            '-p, --participation_nft <string>',
            'participation nft mint',
        )
        .option(
            '-pts, --participation_token_store <string>',
            'participation nft mint',
        )
        .option(
            '-c, --creator <string>',
            'pub key of nft creator',
        )
        .requiredOption(
            '-k, --keypair <path>',
            `Solana wallet location`,
            '--keypair not provided',
        )
        .action(async (vault, nft, token_store, options) =>{
            const { env, keypair, participation_nft, participation_token_store, creator } = options;

            const connection = new Connection(clusterApiUrl(env))
            const wallet = new NodeWallet(loadKeypair(keypair))
            const {payer} = wallet;

            const mintPubKey = new PublicKey(nft);
            const vaultPubKey = new PublicKey(vault);
            const tokenStorePubKey = new PublicKey(token_store);
            const creatorPubKey = creator ? new PublicKey(creator) : payer.publicKey;

            const storeId = await Store.getPDA(payer.publicKey);
            const auctionPDA = await Auction.getPDA(vaultPubKey);
            const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);
            const tokenTrackerPDA = await AuctionWinnerTokenTypeTracker.getPDA(auctionManagerPDA);
            const metadataPDA = await Metadata.getPDA(mintPubKey);
            const editionPDA = await MasterEdition.getPDA(mintPubKey);
            const safetyDepositBox = await SafetyDepositBox.getPDA(vaultPubKey, mintPubKey);
            const safetyDepositConfig = await SafetyDepositConfig.getPDA(auctionManagerPDA,safetyDepositBox);
            const originalAuthorityLookup = await getOriginalLookupPDA(auctionPDA, metadataPDA);
            const whitelistedCreatorPDA = await WhitelistedCreator.getPDA(storeId, creatorPubKey);
            

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

                const tx = new ValidateSafetyDepositBoxV2(
                    {feePayer: payer.publicKey },
                    {   
                        store:storeId,
                        vault: vaultPubKey,
                        auctionManager: auctionManagerPDA,
                        auctionManagerAuthority: payer.publicKey,
                        metadataAuthority: payer.publicKey, 
                        originalAuthorityLookup,
                        tokenTracker: tokenTrackerPDA,
                        tokenAccount: metadataPDA,
                        tokenMint:mintPubKey,
                        edition: editionPDA,
                        whitelistedCreator: whitelistedCreatorPDA,
                        safetyDepositBox,
                        safetyDepositTokenStore: tokenStorePubKey,
                        safetyDepositConfig,
                        safetyDepositConfigData
                    }
                )

                await sendAndConfirmTransaction(connection, tx, [payer], {
                    commitment: 'finalized',
                });
            

            // setup and validate participation nft safety deposit box

            if(participation_nft) {

                const participationPubKey = new PublicKey(participation_nft);
                const participationTokenStore = new PublicKey(participation_token_store);


                const participationMetadataPDA = await Metadata.getPDA(participationPubKey);
                const participationEditionPDA = await MasterEdition.getPDA(participationPubKey);
                const participationSafetyDepositBox = await SafetyDepositBox.getPDA(vaultPubKey, participationPubKey);
                const participationSafetyDepositConfig = await SafetyDepositConfig.getPDA(auctionManagerPDA,participationSafetyDepositBox);
                const participationOriginalAuthorityLookup = await getOriginalLookupPDA(auctionPDA, participationMetadataPDA);


            const participationSafetyDepositConfigData = new SafetyDepositConfigData({
                auctionManager: auctionManagerPDA.toBase58(),
                order: new BN(1),
                winningConfigType: WinningConfigType.Participation,
                amountType: TupleNumericType.U8,
                lengthType: TupleNumericType.U8,
                // not sure what amount ranges for participation nft should be given that it depends on num bidderss
                amountRanges: [new AmountRange({amount: new BN(2), length: new BN(2)})],
                participationConfig: new ParticipationConfigV2({
                    winnerConstraint:   WinningConstraint.ParticipationPrizeGiven,
                    nonWinningConstraint: NonWinningConstraint.GivenForFixedPrice,
                    fixedPrice: null
                }),
                participationState: new ParticipationStateV2({
                    collectedToAcceptPayment: new BN(0),
                  }),
            })

                const tx = new ValidateSafetyDepositBoxV2(
                    {feePayer: payer.publicKey },
                    {   
                        store:storeId,
                        vault: vaultPubKey,
                        auctionManager: auctionManagerPDA,
                        auctionManagerAuthority: payer.publicKey,
                        metadataAuthority: payer.publicKey, 
                        originalAuthorityLookup: participationOriginalAuthorityLookup,
                        tokenTracker: tokenTrackerPDA,
                        tokenAccount: participationMetadataPDA,
                        tokenMint:participationPubKey,
                        edition: participationEditionPDA,
                        whitelistedCreator: whitelistedCreatorPDA,
                        safetyDepositBox: participationSafetyDepositBox,
                        safetyDepositTokenStore: participationTokenStore,
                        safetyDepositConfig: participationSafetyDepositConfig,
                        safetyDepositConfigData: participationSafetyDepositConfigData
                    }
                )

                await sendAndConfirmTransaction(connection, tx, [payer], {
                    commitment: 'finalized',
                });

                console.log(`auction manager validated!`)


            }
        })

    program
        .command('start-auction')
        .argument('<vault>', 'auction vault')
        .option(
            '-e, --env <string>',
            'Solana cluster env name',
            'devnet',
        )
        .requiredOption(
            '-k, --keypair <path>',
            `Solana wallet location`,
            '--keypair not provided',
        )
        .action(async (vault, options) => {

            const { env, keypair } = options;

            const connection = new Connection(clusterApiUrl(env))
            const wallet = new NodeWallet(loadKeypair(keypair))

            const {payer} = wallet
            const vaultPubKey = new PublicKey(vault)

            const storeId = await Store.getPDA(payer.publicKey);
            const auctionPDA = await Auction.getPDA(vaultPubKey);
            const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);

            const setAuctionAuthorityTx = new SetAuctionAuthority(
                { feePayer: payer.publicKey },
                {
                    auction: auctionPDA,
                    currentAuthority: payer.publicKey,
                    newAuthority: auctionManagerPDA
                }
            )

            await sendAndConfirmTransaction(connection, setAuctionAuthorityTx, [payer], {
                commitment: 'finalized',
              });
        
            const tx = new StartAuction(
              { feePayer: payer.publicKey },
              {
                store: storeId,
                auction: auctionPDA,
                auctionManager: auctionManagerPDA,
                auctionManagerAuthority: payer.publicKey,
              },
            );
        
            await sendAndConfirmTransaction(connection, tx, [payer], {
              commitment: 'finalized',
            });

            console.log(`auction ${auctionPDA.toBase58()} has been started`)
        })


        program
        .command('end-auction')
        .argument('<auction>', 'auction pubkey')
        .option(
            '-e, --env <string>',
            'Solana cluster env name',
            'devnet',
        )
        .option(
            '-k, --keypair <path>',
            `Solana wallet location`
        )
        .action(async (auction, options) => {
            const { env, keypair: pathToKeypair } = options;

            const connection = new Connection(clusterApiUrl(env))
            const keypair = await getKeypair(pathToKeypair);
            const wallet = new NodeWallet(keypair);
            const {payer} = wallet


            const auctionManager = await AuctionManager.getPDA(auction);
            const manager = await AuctionManager.load(connection, auctionManager)
            const vaultPubKey = new PublicKey(manager.data.vault);



            const storeId = await Store.getPDA(payer.publicKey);
            const auctionPDA = await Auction.getPDA(vaultPubKey);
            const auctionExtendedPDA = await AuctionExtended.getPDA(vaultPubKey)
            const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);

       
            const tx = new EndAuction(
              { feePayer: payer.publicKey },
              {
                  store:storeId,
                  auction: auctionPDA,
                  auctionExtended:auctionExtendedPDA,
                  auctionManager: auctionManagerPDA,
                  auctionManagerAuthority: wallet.publicKey
               
              },
            );
        
            await sendAndConfirmTransaction(connection, tx, [payer], {
              commitment: 'finalized',
            });

            console.log(`auction ${auctionPDA.toBase58()} has ended`)
        })


        program
        .command('claim-bid')
        .argument('<auction>', 'auction address')
        .argument('<bidder>', 'bidder\'s address')
        .option(
            '-e, --env <string>',
            'Solana cluster env name',
            'devnet',
        )
        .option(
            '-k, --keypair <path>',
            `Solana wallet location`
        )
        .action(async (auction, bidder, options) => {
            const { env, keypair: pathToKeypair } = options;
            const keypair = await getKeypair(pathToKeypair);
            const wallet = new NodeWallet(keypair);
            const { payer } = wallet
                        
            const connection = new Connection(clusterApiUrl(env))
            const storePk = await Store.getPDA(payer.publicKey);
            const bidderPk = new PublicKey(bidder);
            const auctionPk = new PublicKey(auction);
    
            const {txId} = await claimBid({ 
                connection, 
                wallet, 
                store: storePk, 
                auction: auctionPk, 
                bidder: bidderPk
            });
        
            connection.confirmTransaction(txId);
        
            console.log(`transaction success: ${txId}`);
            console.log(`bid by ${bidder} on auction ${auction} has been claimed`)
        })

program.parse(process.argv);
