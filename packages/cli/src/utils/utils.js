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
exports.getOriginalLookupPDA = exports.createMetadataUri = exports.uploadImage = exports.loadKeypair = void 0;
var web3 = require("@solana/web3.js");
var arweave_1 = require("arweave");
var fs_1 = require("fs");
var path_1 = require("path");
var mpl_metaplex_1 = require("@metaplex-foundation/mpl-metaplex");
var loadKeypair = function (keypair) {
    if (!keypair || keypair == '') {
        throw new Error('Keypair is required!');
    }
    var keypairPath = keypair.startsWith("~/") ? path_1["default"].resolve(process.env.HOME, keypair.slice(2)) : path_1["default"].resolve(keypair);
    var loaded = web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs_1["default"].readFileSync(keypairPath).toString())));
    return loaded;
};
exports.loadKeypair = loadKeypair;
var uploadImage = function (_a) {
    var arweaveWallet = _a.arweaveWallet, imagePath = _a.imagePath;
    return __awaiter(void 0, void 0, void 0, function () {
        var host, port, protocol, arweave, arPath, arWallet, address, winston, data, imgTx, imageUri;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    host = "arweave.net";
                    port = "443";
                    protocol = "https";
                    arweave = arweave_1["default"].init({
                        host: host,
                        port: port,
                        protocol: protocol,
                        timeout: 20000
                    });
                    arPath = arweaveWallet.startsWith("~/") ? path_1["default"].resolve(process.env.HOME, arweaveWallet.slice(2)) : path_1["default"].resolve(arweaveWallet);
                    arWallet = JSON.parse(fs_1["default"].readFileSync(arPath).toString());
                    return [4 /*yield*/, arweave.wallets.jwkToAddress(arWallet)];
                case 1:
                    address = _b.sent();
                    return [4 /*yield*/, arweave.wallets.getBalance(address)];
                case 2:
                    winston = _b.sent();
                    console.log("ar address = ", address);
                    console.log("ar balance winstons =", winston);
                    data = fs_1["default"].readFileSync(path_1["default"].resolve(__dirname, imagePath));
                    return [4 /*yield*/, arweave.createTransaction({
                            data: data
                        }, arWallet)];
                case 3:
                    imgTx = _b.sent();
                    imgTx.addTag('App-Name', 'dfs');
                    imgTx.addTag('Content-Type', 'image/png');
                    return [4 /*yield*/, arweave.transactions.sign(imgTx, arWallet)];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, arweave.transactions.post(imgTx)];
                case 5:
                    _b.sent();
                    imageUri = "".concat(protocol, "://").concat(host, ":").concat(port, "/").concat(imgTx.id);
                    console.log("image uploaded successfully");
                    console.log("image url =", imageUri);
                    return [2 /*return*/];
            }
        });
    });
};
exports.uploadImage = uploadImage;
var createMetadataUri = function (_a) {
    var arweaveWallet = _a.arweaveWallet, metadataPath = _a.metadataPath;
    return __awaiter(void 0, void 0, void 0, function () {
        var host, port, protocol, arweave, arPath, arWallet, address, winston, metadata, arTx, metadataUri;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    host = "arweave.net";
                    port = "443";
                    protocol = "https";
                    arweave = arweave_1["default"].init({
                        host: host,
                        port: port,
                        protocol: protocol,
                        timeout: 20000
                    });
                    arPath = arweaveWallet.startsWith("~/") ? path_1["default"].resolve(process.env.HOME, arweaveWallet.slice(2)) : path_1["default"].resolve(arweaveWallet);
                    arWallet = JSON.parse(fs_1["default"].readFileSync(arPath).toString());
                    return [4 /*yield*/, arweave.wallets.jwkToAddress(arWallet)];
                case 1:
                    address = _b.sent();
                    return [4 /*yield*/, arweave.wallets.getBalance(address)];
                case 2:
                    winston = _b.sent();
                    metadata = JSON.parse(fs_1["default"].readFileSync(path_1["default"].resolve(__dirname, metadataPath)).toString());
                    console.log("address = ", address);
                    console.log("balance winstons =", winston);
                    return [4 /*yield*/, arweave.createTransaction({
                            data: JSON.stringify(metadata)
                        }, arWallet)];
                case 3:
                    arTx = _b.sent();
                    arTx.addTag('App-Name', 'dfs');
                    arTx.addTag('Content-Type', 'application/json');
                    return [4 /*yield*/, arweave.transactions.sign(arTx, arWallet)];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, arweave.transactions.post(arTx)];
                case 5:
                    _b.sent();
                    metadataUri = "".concat(protocol, "://").concat(host, ":").concat(port, "/").concat(arTx.id);
                    console.log("metadata URI = ".concat(metadataUri));
                    return [2 /*return*/];
            }
        });
    });
};
exports.createMetadataUri = createMetadataUri;
var getOriginalLookupPDA = function (auctionKey, metadataKey) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, mpl_metaplex_1.MetaplexProgram.findProgramAddress([
                Buffer.from(mpl_metaplex_1.MetaplexProgram.PREFIX),
                auctionKey.toBuffer(),
                metadataKey.toBuffer(),
            ])];
    });
}); };
exports.getOriginalLookupPDA = getOriginalLookupPDA;
