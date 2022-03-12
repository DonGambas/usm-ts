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
exports.SafetyDepositConfig = exports.SafetyDepositConfigData = exports.ParticipationStateV2 = exports.ParticipationConfigV2 = exports.AmountRange = exports.NonWinningConstraint = exports.WinningConstraint = exports.WinningConfigType = void 0;
var web3_js_1 = require("@solana/web3.js");
var mpl_core_1 = require("@metaplex-foundation/mpl-core");
var mpl_metaplex_1 = require("@metaplex-foundation/mpl-metaplex");
var buffer_1 = require("buffer");
var WinningConfigType;
(function (WinningConfigType) {
    /// You may be selling your one-of-a-kind NFT for the first time, but not it's accompanying Metadata,
    /// of which you would like to retain ownership. You get 100% of the payment the first sale, then
    /// royalties forever after.
    ///
    /// You may be re-selling something like a Limited/Open Edition print from another auction,
    /// a master edition record token by itself (Without accompanying metadata/printing ownership), etc.
    /// This means artists will get royalty fees according to the top level royalty % on the metadata
    /// split according to their percentages of contribution.
    ///
    /// No metadata ownership is transferred in this instruction, which means while you may be transferring
    /// the token for a limited/open edition away, you would still be (nominally) the owner of the limited edition
    /// metadata, though it confers no rights or privileges of any kind.
    WinningConfigType[WinningConfigType["TokenOnlyTransfer"] = 0] = "TokenOnlyTransfer";
    /// Means you are auctioning off the master edition record and it's metadata ownership as well as the
    /// token itself. The other person will be able to mint authorization tokens and make changes to the
    /// artwork.
    WinningConfigType[WinningConfigType["FullRightsTransfer"] = 1] = "FullRightsTransfer";
    /// Means you are using authorization tokens to print off editions during the auction using
    /// from a MasterEditionV1
    WinningConfigType[WinningConfigType["PrintingV1"] = 2] = "PrintingV1";
    /// Means you are using the MasterEditionV2 to print off editions
    WinningConfigType[WinningConfigType["PrintingV2"] = 3] = "PrintingV2";
    /// Means you are using a MasterEditionV2 as a participation prize.
    WinningConfigType[WinningConfigType["Participation"] = 4] = "Participation";
})(WinningConfigType = exports.WinningConfigType || (exports.WinningConfigType = {}));
var WinningConstraint;
(function (WinningConstraint) {
    WinningConstraint[WinningConstraint["NoParticipationPrize"] = 0] = "NoParticipationPrize";
    WinningConstraint[WinningConstraint["ParticipationPrizeGiven"] = 1] = "ParticipationPrizeGiven";
})(WinningConstraint = exports.WinningConstraint || (exports.WinningConstraint = {}));
var NonWinningConstraint;
(function (NonWinningConstraint) {
    NonWinningConstraint[NonWinningConstraint["NoParticipationPrize"] = 0] = "NoParticipationPrize";
    NonWinningConstraint[NonWinningConstraint["GivenForFixedPrice"] = 1] = "GivenForFixedPrice";
    NonWinningConstraint[NonWinningConstraint["GivenForBidPrice"] = 2] = "GivenForBidPrice";
})(NonWinningConstraint = exports.NonWinningConstraint || (exports.NonWinningConstraint = {}));
var AmountRange = /** @class */ (function (_super) {
    __extends(AmountRange, _super);
    function AmountRange() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    var _a;
    _a = AmountRange;
    AmountRange.SCHEMA = _a.struct([
        ['amount', 'u64'],
        ['length', 'u64'],
    ]);
    return AmountRange;
}(mpl_core_1.Borsh.Data));
exports.AmountRange = AmountRange;
var ParticipationConfigV2 = /** @class */ (function (_super) {
    __extends(ParticipationConfigV2, _super);
    function ParticipationConfigV2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    var _b;
    _b = ParticipationConfigV2;
    ParticipationConfigV2.SCHEMA = _b.struct([
        ['winnerConstraint', 'u8'],
        ['nonWinningConstraint', 'u8'],
        ['fixedPrice', { kind: 'option', type: 'u64' }],
    ]);
    return ParticipationConfigV2;
}(mpl_core_1.Borsh.Data));
exports.ParticipationConfigV2 = ParticipationConfigV2;
var ParticipationStateV2 = /** @class */ (function (_super) {
    __extends(ParticipationStateV2, _super);
    function ParticipationStateV2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    var _c;
    _c = ParticipationStateV2;
    ParticipationStateV2.SCHEMA = _c.struct([['collectedToAcceptPayment', 'u64']]);
    return ParticipationStateV2;
}(mpl_core_1.Borsh.Data));
exports.ParticipationStateV2 = ParticipationStateV2;
var SafetyDepositConfigData = /** @class */ (function (_super) {
    __extends(SafetyDepositConfigData, _super);
    function SafetyDepositConfigData(args) {
        var _this = _super.call(this, args) || this;
        _this.key = mpl_metaplex_1.MetaplexKey.SafetyDepositConfigV1;
        _this.key = mpl_metaplex_1.MetaplexKey.SafetyDepositConfigV1;
        return _this;
    }
    var _d;
    _d = SafetyDepositConfigData;
    SafetyDepositConfigData.SCHEMA = new Map(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], ParticipationConfigV2.SCHEMA, true), ParticipationStateV2.SCHEMA, true), AmountRange.SCHEMA, true), _d.struct([
        ['key', 'u8'],
        ['auctionManager', 'pubkeyAsString'],
        ['order', 'u64'],
        ['winningConfigType', 'u8'],
        ['amountType', 'u8'],
        ['lengthType', 'u8'],
        ['amountRanges', [AmountRange]],
        ['participationConfig', { kind: 'option', type: ParticipationConfigV2 }],
        ['participationState', { kind: 'option', type: ParticipationStateV2 }],
    ]), true));
    return SafetyDepositConfigData;
}(mpl_core_1.Borsh.Data));
exports.SafetyDepositConfigData = SafetyDepositConfigData;
var SafetyDepositConfig = /** @class */ (function (_super) {
    __extends(SafetyDepositConfig, _super);
    function SafetyDepositConfig(pubkey, info) {
        var _this = _super.call(this, pubkey, info) || this;
        if (!_this.assertOwner(mpl_metaplex_1.MetaplexProgram.PUBKEY)) {
            throw (0, mpl_core_1.ERROR_INVALID_OWNER)();
        }
        if (!SafetyDepositConfig.isCompatible(_this.info.data)) {
            throw (0, mpl_core_1.ERROR_INVALID_ACCOUNT_DATA)();
        }
        _this.data = SafetyDepositConfigData.deserialize(_this.info.data);
        return _this;
    }
    SafetyDepositConfig.isCompatible = function (data) {
        return data[0] === mpl_metaplex_1.MetaplexKey.SafetyDepositConfigV1;
    };
    SafetyDepositConfig.getPDA = function (auctionManager, safetyDeposit) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_e) {
                return [2 /*return*/, mpl_metaplex_1.MetaplexProgram.findProgramAddress([
                        buffer_1.Buffer.from(mpl_metaplex_1.MetaplexProgram.PREFIX),
                        mpl_metaplex_1.MetaplexProgram.PUBKEY.toBuffer(),
                        new web3_js_1.PublicKey(auctionManager).toBuffer(),
                        new web3_js_1.PublicKey(safetyDeposit).toBuffer(),
                    ])];
            });
        });
    };
    return SafetyDepositConfig;
}(mpl_core_1.Account));
exports.SafetyDepositConfig = SafetyDepositConfig;
