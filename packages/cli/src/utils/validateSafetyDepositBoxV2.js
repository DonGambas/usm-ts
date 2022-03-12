"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.ValidateSafetyDepositBoxV2 = exports.ValidateSafetyDepositBoxV2Args = void 0;
var mpl_core_1 = require("@metaplex-foundation/mpl-core");
var mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
var web3_js_1 = require("@solana/web3.js");
var mpl_metaplex_1 = require("@metaplex-foundation/mpl-metaplex");
var SafetyDepositConfig_1 = require("./SafetyDepositConfig");
var ValidateSafetyDepositBoxV2Args = /** @class */ (function (_super) {
    __extends(ValidateSafetyDepositBoxV2Args, _super);
    function ValidateSafetyDepositBoxV2Args() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.instruction = 18;
        return _this;
    }
    var _a;
    _a = ValidateSafetyDepositBoxV2Args;
    ValidateSafetyDepositBoxV2Args.SCHEMA = new Map(__spreadArray(__spreadArray([], SafetyDepositConfig_1.SafetyDepositConfigData.SCHEMA, true), _a.struct([
        ['instruction', 'u8'],
        ['safetyDepositConfig', SafetyDepositConfig_1.SafetyDepositConfigData],
    ]), true));
    return ValidateSafetyDepositBoxV2Args;
}(mpl_core_1.Borsh.Data));
exports.ValidateSafetyDepositBoxV2Args = ValidateSafetyDepositBoxV2Args;
var ValidateSafetyDepositBoxV2 = /** @class */ (function (_super) {
    __extends(ValidateSafetyDepositBoxV2, _super);
    function ValidateSafetyDepositBoxV2(options, params) {
        var _this = _super.call(this, options) || this;
        var feePayer = options.feePayer;
        var store = params.store, vault = params.vault, auctionManager = params.auctionManager, auctionManagerAuthority = params.auctionManagerAuthority, metadataAuthority = params.metadataAuthority, originalAuthorityLookup = params.originalAuthorityLookup, tokenTracker = params.tokenTracker, tokenAccount = params.tokenAccount, tokenMint = params.tokenMint, edition = params.edition, whitelistedCreator = params.whitelistedCreator, safetyDepositBox = params.safetyDepositBox, safetyDepositTokenStore = params.safetyDepositTokenStore, safetyDepositConfig = params.safetyDepositConfig, safetyDepositConfigData = params.safetyDepositConfigData;
        var data = ValidateSafetyDepositBoxV2Args.serialize({
            safetyDepositConfig: safetyDepositConfigData
        });
        _this.add(new web3_js_1.TransactionInstruction({
            keys: [
                {
                    pubkey: safetyDepositConfig,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: tokenTracker,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: auctionManager,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: tokenAccount,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: originalAuthorityLookup,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: whitelistedCreator,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: store,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: safetyDepositBox,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: safetyDepositTokenStore,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: tokenMint,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: edition,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: vault,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: auctionManagerAuthority,
                    isSigner: true,
                    isWritable: false
                },
                {
                    pubkey: metadataAuthority,
                    isSigner: true,
                    isWritable: false
                },
                {
                    pubkey: feePayer,
                    isSigner: true,
                    isWritable: false
                },
                {
                    pubkey: mpl_token_metadata_1.MetadataProgram.PUBKEY,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: web3_js_1.SystemProgram.programId,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: web3_js_1.SYSVAR_RENT_PUBKEY,
                    isSigner: false,
                    isWritable: false
                },
            ],
            programId: mpl_metaplex_1.MetaplexProgram.PUBKEY,
            data: data
        }));
        return _this;
    }
    return ValidateSafetyDepositBoxV2;
}(mpl_core_1.Transaction));
exports.ValidateSafetyDepositBoxV2 = ValidateSafetyDepositBoxV2;
