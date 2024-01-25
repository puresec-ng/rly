"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
exports.config = {
    programs: {
        canonicalSwap: "CSwAp3hdedZJBmhWMjv8BJ7anTLMQ2hBqKdnXV5bB3Nz",
        tokenSwap: "TBCwReYDDw8SvwVVKJHgatzeXKrLHnaTPyDGwkUoBsq",
        token: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    },
    pda: {
        CANONICAL_MINT_AUTHORITY_PDA_SEED: anchor.utils.bytes.utf8.encode("can_mint_authority"),
        TOKEN_ACCOUNT_PDA_SEED: anchor.utils.bytes.utf8.encode("token_account_seed"),
        WRAPPED_TOKEN_OWNER_AUTHORITY_PDA_SEED: anchor.utils.bytes.utf8.encode("wrapped_acct_authority"),
        METADATA: anchor.utils.bytes.utf8.encode("metadata"),
    },
    accountLayout: {
        SWAP_ACCOUNT_SPACE: 324,
        WRAPPED_DATA_SPACE: 8 + 68,
        CANONICAL_DATA_SPACE: 8 + 66,
    },
};
