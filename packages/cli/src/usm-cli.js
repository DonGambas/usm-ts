#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var web3 = require("@solana/web3.js");
var bn_js_1 = require("bn.js");
var spl_token_1 = require("@solana/spl-token");
var js_1 = require("@metaplex/js");
var initStoreV2 = js_1.actions.initStoreV2, createExternalPriceAccount = js_1.actions.createExternalPriceAccount, createVault = js_1.actions.createVault, initAuction = js_1.actions.initAuction, addTokensToVault = js_1.actions.addTokensToVault, mintNFT = js_1.actions.mintNFT, closeVault = js_1.actions.closeVault, claimBid = js_1.actions.claimBid;
var Connection = web3.Connection, clusterApiUrl = web3.clusterApiUrl, PublicKey = web3.PublicKey, sendAndConfirmTransaction = web3.sendAndConfirmTransaction;
var utils_1 = require("./utils/utils");
var SafetyDepositConfig_1 = require("./utils/SafetyDepositConfig");
var mpl_auction_1 = require("@metaplex-foundation/mpl-auction");
var mpl_token_vault_1 = require("@metaplex-foundation/mpl-token-vault");
var mpl_metaplex_1 = require("@metaplex-foundation/mpl-metaplex");
var mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
var validateSafetyDepositBoxV2_1 = require("./utils/validateSafetyDepositBoxV2");
var mpl_core_1 = require("@metaplex-foundation/mpl-core");
var commander_1 = require("commander");
commander_1.program.version('1.0.0');
commander_1.program
    .command('init-store')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, connection, wallet, storeId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                return [4 /*yield*/, initStoreV2({ connection: connection, wallet: wallet, settingsUri: null, isPublic: false })];
            case 1:
                storeId = (_a.sent()).storeId;
                console.log("store initialized, id = ", storeId.toBase58());
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('set-whitelist-creator')
    .argument('<store>', 'store id')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .option('-c, --creator <string>', 'creator adddresss')
    .action(function (store, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, creator, connection, wallet, payer, storeId, creatorPubKey, whitelistedCreatorPDA, tx, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair, creator = options.creator;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                payer = wallet.payer;
                storeId = new PublicKey(store);
                creatorPubKey = creator ? new PublicKey(creator) : payer.publicKey;
                return [4 /*yield*/, mpl_metaplex_1.WhitelistedCreator.getPDA(storeId, creatorPubKey)];
            case 1:
                whitelistedCreatorPDA = _a.sent();
                tx = new mpl_metaplex_1.SetWhitelistedCreator({ feePayer: payer.publicKey }, {
                    admin: payer.publicKey,
                    store: storeId,
                    whitelistedCreatorPDA: whitelistedCreatorPDA,
                    creator: creatorPubKey,
                    activated: true
                });
                return [4 /*yield*/, sendAndConfirmTransaction(connection, tx, [payer, payer], {
                        commitment: 'confirmed'
                    })];
            case 2:
                result = _a.sent();
                console.log("creator ".concat(creatorPubKey, " white listed on store ").concat(storeId));
                console.log("tx id ".concat(result));
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('create-vault')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, connection, wallet, _a, txId, externalPriceAccount, priceMint, vault;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                env = options.env, keypair = options.keypair;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                return [4 /*yield*/, createExternalPriceAccount({ connection: connection, wallet: wallet })
                    // await createExternalPriceAccount to succeed before creating vault
                ];
            case 1:
                _a = _b.sent(), txId = _a.txId, externalPriceAccount = _a.externalPriceAccount, priceMint = _a.priceMint;
                // await createExternalPriceAccount to succeed before creating vault
                return [4 /*yield*/, connection.confirmTransaction(txId)];
            case 2:
                // await createExternalPriceAccount to succeed before creating vault
                _b.sent();
                return [4 /*yield*/, createVault({ connection: connection, wallet: wallet, externalPriceAccount: externalPriceAccount, priceMint: priceMint })];
            case 3:
                vault = (_b.sent()).vault;
                console.log("vault created successfully key = ", vault.toBase58());
                console.log("price mint = ", priceMint.toBase58());
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('upload-image')
    .requiredOption('-ar, --arwallet <path>', 'ar wallet path', '--arwallet not provided')
    .requiredOption('-i, --image <path>', "path to image", '--image-path not provided')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var image, arwallet;
    return __generator(this, function (_a) {
        image = options.image, arwallet = options.arwallet;
        return [2 /*return*/, (0, utils_1.uploadImage)({ arweaveWallet: arwallet, imagePath: image })];
    });
}); });
commander_1.program
    .command('create-metadata-uri')
    .requiredOption('-ar, --arwallet <path>', 'ar wallet path', '--arwallet not provided')
    .requiredOption('-m, --metadata <path>', "metadata json location", '--metadata-path not provided')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var metadata, arwallet;
    return __generator(this, function (_a) {
        metadata = options.metadata, arwallet = options.arwallet;
        return [2 /*return*/, (0, utils_1.createMetadataUri)({ arweaveWallet: arwallet, metadataPath: metadata })];
    });
}); });
commander_1.program
    .command('mint-nft')
    .argument('<uri>', 'metadata uri')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .option('--participation', 'use if this is a participation nft')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (uri, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, participation, connection, wallet, _a, txId, mint;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                env = options.env, keypair = options.keypair, participation = options.participation;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                return [4 /*yield*/, mintNFT({ connection: connection, wallet: wallet, uri: uri, maxSupply: participation ? null : 1 })];
            case 1:
                _a = _b.sent(), txId = _a.txId, mint = _a.mint;
                return [4 /*yield*/, connection.confirmTransaction(txId)];
            case 2:
                _b.sent();
                console.log("".concat(participation && "participation ", "nft created, pub key = ").concat(mint.toBase58()));
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('add-nft-to-vault')
    .argument('<nft>', 'nft pub key')
    .argument('<vault>', 'vault pub key')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (nft, vault, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, connection, wallet, payer, nftMint, vaultPubKey, nftToken, address, safetyDepositTokenStores;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                payer = wallet.payer;
                nftMint = new PublicKey(nft);
                vaultPubKey = new PublicKey(vault);
                nftToken = new spl_token_1.Token(connection, nftMint, spl_token_1.TOKEN_PROGRAM_ID, payer);
                return [4 /*yield*/, nftToken.getOrCreateAssociatedAccountInfo(payer.publicKey)];
            case 1:
                address = (_a.sent()).address;
                return [4 /*yield*/, addTokensToVault({
                        connection: connection,
                        wallet: wallet,
                        vault: vaultPubKey, nfts: [{ tokenAccount: address, tokenMint: nftMint, amount: new bn_js_1["default"](1) }]
                    })];
            case 2:
                safetyDepositTokenStores = (_a.sent()).safetyDepositTokenStores;
                console.log("nft succesfully added to vault ".concat(vault));
                console.log("Token store account = ,", safetyDepositTokenStores[0].tokenStoreAccount.toBase58());
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('close-vault')
    .argument('<vault>', 'vault pub key')
    .argument('<price_mint>', 'price mint pub key')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (vault, price_mint, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, connection, wallet, vaultPubKey, priceMintPubKey;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                vaultPubKey = new PublicKey(vault);
                priceMintPubKey = new PublicKey(price_mint);
                return [4 /*yield*/, closeVault({ connection: connection, wallet: wallet, vault: vaultPubKey, priceMint: priceMintPubKey })];
            case 1:
                _a.sent();
                console.log("vault ".concat(vault, " state moved to combined, ready for init auction"));
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('init-auction')
    .argument('<vault>', 'auction vault')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .option('-m, --minprice <number>', "minimum price for auction in SOL", '0')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .option('-e, --endtime <number>', "unix timestamp of end time of auction")
    .action(function (vault, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, endtime, minprice, connection, wallet, vaultPubKey, auctionSettings, _a, txId, auction, auctionInstance;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                env = options.env, keypair = options.keypair, endtime = options.endtime, minprice = options.minprice;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                vaultPubKey = new PublicKey(vault);
                auctionSettings = {
                    instruction: 1,
                    tickSize: null,
                    auctionGap: null,
                    endAuctionAt: endtime ? new bn_js_1["default"](endtime) : null,
                    gapTickSizePercentage: null,
                    resource: vaultPubKey,
                    winners: new mpl_auction_1.WinnerLimit({
                        type: mpl_auction_1.WinnerLimitType.Capped,
                        usize: new bn_js_1["default"](1)
                    }),
                    tokenMint: spl_token_1.NATIVE_MINT.toBase58(),
                    priceFloor: new mpl_auction_1.PriceFloor({
                        type: Number(Number(minprice) * web3.LAMPORTS_PER_SOL) > 0 ? mpl_auction_1.PriceFloorType.Minimum : mpl_auction_1.PriceFloorType.None,
                        minPrice: new bn_js_1["default"](Number(minprice) * web3.LAMPORTS_PER_SOL)
                    })
                };
                return [4 /*yield*/, initAuction({ connection: connection, wallet: wallet, vault: vaultPubKey, auctionSettings: auctionSettings })];
            case 1:
                _a = _b.sent(), txId = _a.txId, auction = _a.auction;
                return [4 /*yield*/, connection.confirmTransaction(txId)];
            case 2:
                _b.sent();
                return [4 /*yield*/, mpl_auction_1.Auction.load(connection, auction)];
            case 3:
                auctionInstance = _b.sent();
                console.log("auction created at", auctionInstance.pubkey.toBase58());
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('init-auction-manager')
    .argument('<vault>', 'auction vault')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (vault, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, connection, wallet, payer, vaultPubKey, storeId, auctionPDA, auctionManagerPDA, tokenTrackerPDA, nativeMint, paymentAccount, initAuctionManagerTx, SetVaultAuthorityTx, txs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                payer = wallet.payer;
                vaultPubKey = new PublicKey(vault);
                return [4 /*yield*/, mpl_metaplex_1.Store.getPDA(payer.publicKey)];
            case 1:
                storeId = _a.sent();
                return [4 /*yield*/, mpl_auction_1.Auction.getPDA(vaultPubKey)];
            case 2:
                auctionPDA = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.AuctionManager.getPDA(auctionPDA)];
            case 3:
                auctionManagerPDA = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.AuctionWinnerTokenTypeTracker.getPDA(auctionManagerPDA)];
            case 4:
                tokenTrackerPDA = _a.sent();
                nativeMint = new spl_token_1.Token(connection, spl_token_1.NATIVE_MINT, spl_token_1.TOKEN_PROGRAM_ID, payer);
                return [4 /*yield*/, nativeMint.createAccount(auctionManagerPDA)];
            case 5:
                paymentAccount = _a.sent();
                initAuctionManagerTx = new mpl_metaplex_1.InitAuctionManagerV2({ feePayer: payer.publicKey }, {
                    store: storeId,
                    vault: vaultPubKey,
                    auction: auctionPDA,
                    auctionManager: auctionManagerPDA,
                    auctionManagerAuthority: payer.publicKey,
                    acceptPaymentAccount: paymentAccount,
                    tokenTracker: tokenTrackerPDA,
                    amountType: mpl_core_1.TupleNumericType.U8,
                    lengthType: mpl_core_1.TupleNumericType.U8,
                    maxRanges: new bn_js_1["default"](10)
                });
                SetVaultAuthorityTx = new mpl_token_vault_1.SetVaultAuthority({ feePayer: payer.publicKey }, {
                    vault: vaultPubKey,
                    currentAuthority: payer.publicKey,
                    newAuthority: auctionManagerPDA
                });
                txs = mpl_core_1.Transaction.fromCombined([initAuctionManagerTx, SetVaultAuthorityTx]);
                return [4 /*yield*/, sendAndConfirmTransaction(connection, txs, [payer, payer], {
                        commitment: 'confirmed'
                    })];
            case 6:
                _a.sent();
                console.log("auction manager created at", auctionManagerPDA.toBase58(), "vault and auction authority transfered to auction manager");
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('validate-auction-manager')
    .argument('<vault>', 'auction vault')
    .argument('<nft>', 'nft mint')
    .argument('<token_store>', 'nft token store')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .option('-p, --participation_nft <string>', 'participation nft mint')
    .option('-pts, --participation_token_store <string>', 'participation nft mint')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (vault, nft, token_store, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, participation_nft, participation_token_store, connection, wallet, payer, mintPubKey, vaultPubKey, tokenStorePubKey, storeId, auctionPDA, auctionManagerPDA, tokenTrackerPDA, metadataPDA, editionPDA, safetyDepositBox, safetyDepositConfig, originalAuthorityLookup, whitelistedCreatorPDA, safetyDepositConfigData, tx, participationPubKey, participationTokenStore, participationMetadataPDA, participationEditionPDA, participationSafetyDepositBox, participationSafetyDepositConfig, participationOriginalAuthorityLookup, participationSafetyDepositConfigData, tx_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair, participation_nft = options.participation_nft, participation_token_store = options.participation_token_store;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                payer = wallet.payer;
                mintPubKey = new PublicKey(nft);
                vaultPubKey = new PublicKey(vault);
                tokenStorePubKey = new PublicKey(token_store);
                return [4 /*yield*/, mpl_metaplex_1.Store.getPDA(payer.publicKey)];
            case 1:
                storeId = _a.sent();
                return [4 /*yield*/, mpl_auction_1.Auction.getPDA(vaultPubKey)];
            case 2:
                auctionPDA = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.AuctionManager.getPDA(auctionPDA)];
            case 3:
                auctionManagerPDA = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.AuctionWinnerTokenTypeTracker.getPDA(auctionManagerPDA)];
            case 4:
                tokenTrackerPDA = _a.sent();
                return [4 /*yield*/, mpl_token_metadata_1.Metadata.getPDA(mintPubKey)];
            case 5:
                metadataPDA = _a.sent();
                return [4 /*yield*/, mpl_token_metadata_1.MasterEdition.getPDA(mintPubKey)];
            case 6:
                editionPDA = _a.sent();
                return [4 /*yield*/, mpl_token_vault_1.SafetyDepositBox.getPDA(vaultPubKey, mintPubKey)];
            case 7:
                safetyDepositBox = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.SafetyDepositConfig.getPDA(auctionManagerPDA, safetyDepositBox)];
            case 8:
                safetyDepositConfig = _a.sent();
                return [4 /*yield*/, (0, utils_1.getOriginalLookupPDA)(auctionPDA, metadataPDA)];
            case 9:
                originalAuthorityLookup = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.WhitelistedCreator.getPDA(storeId, payer.publicKey)];
            case 10:
                whitelistedCreatorPDA = _a.sent();
                safetyDepositConfigData = new SafetyDepositConfig_1.SafetyDepositConfigData({
                    auctionManager: auctionManagerPDA.toBase58(),
                    order: new bn_js_1["default"](0),
                    winningConfigType: SafetyDepositConfig_1.WinningConfigType.TokenOnlyTransfer,
                    amountType: mpl_core_1.TupleNumericType.U8,
                    lengthType: mpl_core_1.TupleNumericType.U8,
                    amountRanges: [new SafetyDepositConfig_1.AmountRange({ amount: new bn_js_1["default"](1), length: new bn_js_1["default"](1) })],
                    participationConfig: null,
                    participationState: null
                });
                tx = new validateSafetyDepositBoxV2_1.ValidateSafetyDepositBoxV2({ feePayer: payer.publicKey }, {
                    store: storeId,
                    vault: vaultPubKey,
                    auctionManager: auctionManagerPDA,
                    auctionManagerAuthority: payer.publicKey,
                    metadataAuthority: payer.publicKey,
                    originalAuthorityLookup: originalAuthorityLookup,
                    tokenTracker: tokenTrackerPDA,
                    tokenAccount: metadataPDA,
                    tokenMint: mintPubKey,
                    edition: editionPDA,
                    whitelistedCreator: whitelistedCreatorPDA,
                    safetyDepositBox: safetyDepositBox,
                    safetyDepositTokenStore: tokenStorePubKey,
                    safetyDepositConfig: safetyDepositConfig,
                    safetyDepositConfigData: safetyDepositConfigData
                });
                return [4 /*yield*/, sendAndConfirmTransaction(connection, tx, [payer], {
                        commitment: 'confirmed'
                    })];
            case 11:
                _a.sent();
                if (!participation_nft) return [3 /*break*/, 18];
                participationPubKey = new PublicKey(participation_nft);
                participationTokenStore = new PublicKey(participation_token_store);
                return [4 /*yield*/, mpl_token_metadata_1.Metadata.getPDA(participationPubKey)];
            case 12:
                participationMetadataPDA = _a.sent();
                return [4 /*yield*/, mpl_token_metadata_1.MasterEdition.getPDA(participationPubKey)];
            case 13:
                participationEditionPDA = _a.sent();
                return [4 /*yield*/, mpl_token_vault_1.SafetyDepositBox.getPDA(vaultPubKey, participationPubKey)];
            case 14:
                participationSafetyDepositBox = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.SafetyDepositConfig.getPDA(auctionManagerPDA, participationSafetyDepositBox)];
            case 15:
                participationSafetyDepositConfig = _a.sent();
                return [4 /*yield*/, (0, utils_1.getOriginalLookupPDA)(auctionPDA, participationMetadataPDA)];
            case 16:
                participationOriginalAuthorityLookup = _a.sent();
                participationSafetyDepositConfigData = new SafetyDepositConfig_1.SafetyDepositConfigData({
                    auctionManager: auctionManagerPDA.toBase58(),
                    order: new bn_js_1["default"](1),
                    winningConfigType: SafetyDepositConfig_1.WinningConfigType.Participation,
                    amountType: mpl_core_1.TupleNumericType.U8,
                    lengthType: mpl_core_1.TupleNumericType.U8,
                    // not sure what amount ranges for participation nft should be given that it depends on num bidderss
                    amountRanges: [new SafetyDepositConfig_1.AmountRange({ amount: new bn_js_1["default"](1), length: new bn_js_1["default"](1) })],
                    participationConfig: new SafetyDepositConfig_1.ParticipationConfigV2({
                        winnerConstraint: SafetyDepositConfig_1.WinningConstraint.ParticipationPrizeGiven,
                        nonWinningConstraint: SafetyDepositConfig_1.NonWinningConstraint.GivenForFixedPrice,
                        fixedPrice: null
                    }),
                    participationState: new SafetyDepositConfig_1.ParticipationStateV2({
                        collectedToAcceptPayment: new bn_js_1["default"](0)
                    })
                });
                tx_1 = new validateSafetyDepositBoxV2_1.ValidateSafetyDepositBoxV2({ feePayer: payer.publicKey }, {
                    store: storeId,
                    vault: vaultPubKey,
                    auctionManager: auctionManagerPDA,
                    auctionManagerAuthority: payer.publicKey,
                    metadataAuthority: payer.publicKey,
                    originalAuthorityLookup: participationOriginalAuthorityLookup,
                    tokenTracker: tokenTrackerPDA,
                    tokenAccount: participationMetadataPDA,
                    tokenMint: participationPubKey,
                    edition: participationEditionPDA,
                    whitelistedCreator: whitelistedCreatorPDA,
                    safetyDepositBox: participationSafetyDepositBox,
                    safetyDepositTokenStore: participationTokenStore,
                    safetyDepositConfig: participationSafetyDepositConfig,
                    safetyDepositConfigData: participationSafetyDepositConfigData
                });
                return [4 /*yield*/, sendAndConfirmTransaction(connection, tx_1, [payer], {
                        commitment: 'confirmed'
                    })];
            case 17:
                _a.sent();
                console.log("auction manager validated!");
                _a.label = 18;
            case 18: return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('start-auction')
    .argument('<vault>', 'auction vault')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (vault, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, connection, wallet, payer, vaultPubKey, storeId, auctionPDA, auctionManagerPDA, setAuctionAuthorityTx, tx;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                payer = wallet.payer;
                vaultPubKey = new PublicKey(vault);
                return [4 /*yield*/, mpl_metaplex_1.Store.getPDA(payer.publicKey)];
            case 1:
                storeId = _a.sent();
                return [4 /*yield*/, mpl_auction_1.Auction.getPDA(vaultPubKey)];
            case 2:
                auctionPDA = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.AuctionManager.getPDA(auctionPDA)];
            case 3:
                auctionManagerPDA = _a.sent();
                setAuctionAuthorityTx = new mpl_auction_1.SetAuctionAuthority({ feePayer: payer.publicKey }, {
                    auction: auctionPDA,
                    currentAuthority: payer.publicKey,
                    newAuthority: auctionManagerPDA
                });
                return [4 /*yield*/, sendAndConfirmTransaction(connection, setAuctionAuthorityTx, [payer], {
                        commitment: 'confirmed'
                    })];
            case 4:
                _a.sent();
                tx = new mpl_metaplex_1.StartAuction({ feePayer: payer.publicKey }, {
                    store: storeId,
                    auction: auctionPDA,
                    auctionManager: auctionManagerPDA,
                    auctionManagerAuthority: payer.publicKey
                });
                return [4 /*yield*/, sendAndConfirmTransaction(connection, tx, [payer, payer], {
                        commitment: 'confirmed'
                    })];
            case 5:
                _a.sent();
                console.log("auction ".concat(auctionPDA.toBase58(), " has been started"));
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('end-auction')
    .argument('<vault>', 'auction vault')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (vault, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, connection, wallet, payer, storeId, vaultPubKey, auctionPDA, auctionExtendedPDA, auctionManagerPDA, tx;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                payer = wallet.payer;
                return [4 /*yield*/, mpl_metaplex_1.Store.getPDA(payer.publicKey)];
            case 1:
                storeId = _a.sent();
                vaultPubKey = new PublicKey(vault);
                return [4 /*yield*/, mpl_auction_1.Auction.getPDA(vaultPubKey)];
            case 2:
                auctionPDA = _a.sent();
                return [4 /*yield*/, mpl_auction_1.AuctionExtended.getPDA(vaultPubKey)];
            case 3:
                auctionExtendedPDA = _a.sent();
                return [4 /*yield*/, mpl_metaplex_1.AuctionManager.getPDA(auctionPDA)];
            case 4:
                auctionManagerPDA = _a.sent();
                tx = new mpl_metaplex_1.EndAuction({ feePayer: payer.publicKey }, {
                    store: storeId,
                    auction: auctionPDA,
                    auctionExtended: auctionExtendedPDA,
                    auctionManager: auctionManagerPDA,
                    auctionManagerAuthority: auctionManagerPDA
                });
                return [4 /*yield*/, sendAndConfirmTransaction(connection, tx, [payer, payer], {
                        commitment: 'confirmed'
                    })];
            case 5:
                _a.sent();
                console.log("auction ".concat(auctionPDA.toBase58(), " has ended"));
                return [2 /*return*/];
        }
    });
}); });
commander_1.program
    .command('claim-bid')
    .argument('<vault>', 'auction vault')
    .option('-e, --env <string>', 'Solana cluster env name', 'devnet')
    .requiredOption('-k, --keypair <path>', "Solana wallet location", '--keypair not provided')
    .action(function (vault, options) { return __awaiter(void 0, void 0, void 0, function () {
    var env, keypair, connection, wallet, payer, storeId, vaultPubKey, auctionPDA, txId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                env = options.env, keypair = options.keypair;
                connection = new Connection(clusterApiUrl(env));
                wallet = new js_1.NodeWallet((0, utils_1.loadKeypair)(keypair));
                payer = wallet.payer;
                return [4 /*yield*/, mpl_metaplex_1.Store.getPDA(payer.publicKey)];
            case 1:
                storeId = _a.sent();
                vaultPubKey = new PublicKey(vault);
                return [4 /*yield*/, mpl_auction_1.Auction.getPDA(vaultPubKey)];
            case 2:
                auctionPDA = _a.sent();
                return [4 /*yield*/, claimBid({ connection: connection, wallet: wallet, store: storeId, auction: auctionPDA, bidderPotToken: wallet.publicKey })];
            case 3:
                txId = (_a.sent()).txId;
                connection.confirmTransaction(txId);
                console.log("auction ".concat(auctionPDA.toBase58(), " has ended"));
                return [2 /*return*/];
        }
    });
}); });
commander_1.program.parse(process.argv);
