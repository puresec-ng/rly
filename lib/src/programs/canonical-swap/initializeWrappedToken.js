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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWrappedToken = exports.initializeWrappedTokenTx = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@project-serum/anchor");
const config_1 = require("../../../config");
const utils_1 = require("../../utils");
const { pda: { WRAPPED_TOKEN_OWNER_AUTHORITY_PDA_SEED, TOKEN_ACCOUNT_PDA_SEED }, accountLayout: { WRAPPED_DATA_SPACE }, } = config_1.config;
const { PublicKey, SystemProgram: { programId }, Transaction, } = anchor_1.web3;
const initializeWrappedTokenTx = ({ canSwap, wrappedMint, wrappedData, canonicalMint, canonicalData, canonicalAuthority, walletPubKey, connection, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = new Transaction();
    const [wrappedTokenAccount] = yield PublicKey.findProgramAddress([TOKEN_ACCOUNT_PDA_SEED, canonicalMint.toBuffer(), wrappedMint.toBuffer()], canSwap.programId);
    const [wrappedTokenAccountAuthority] = yield PublicKey.findProgramAddress([
        WRAPPED_TOKEN_OWNER_AUTHORITY_PDA_SEED,
        canonicalMint.toBuffer(),
        wrappedMint.toBuffer(),
    ], canSwap.programId);
    const wrappedDataIx = yield canSwap.account.wrappedData.createInstruction(wrappedData, WRAPPED_DATA_SPACE);
    const initIx = yield canSwap.instruction.initializeWrappedToken({
        accounts: {
            currentAuthority: canonicalAuthority.publicKey,
            wrappedTokenMint: wrappedMint,
            pdaWrappedTokenAccount: wrappedTokenAccount,
            pdaWrappedTokenAccountAuthority: wrappedTokenAccountAuthority,
            canonicalData: canonicalData,
            wrappedData: wrappedData.publicKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            rent: anchor_1.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: programId,
        },
    });
    transaction.add(wrappedDataIx, initIx);
    yield (0, utils_1.addTxPayerAndHash)(transaction, connection, walletPubKey);
    yield (0, utils_1.partialSignTx)(transaction, [wrappedData]);
    return transaction;
});
exports.initializeWrappedTokenTx = initializeWrappedTokenTx;
const initializeWrappedToken = ({ canSwap, wrappedMint, wrappedData, canonicalMint, canonicalData, canonicalAuthority, connection, wallet, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield (0, exports.initializeWrappedTokenTx)({
        canSwap,
        wrappedMint,
        wrappedData,
        canonicalMint,
        canonicalData,
        canonicalAuthority,
        walletPubKey: wallet.publicKey,
        connection,
    });
    return (0, utils_1.sendTx)(wallet, connection, transaction, { commitment: "finalized" });
});
exports.initializeWrappedToken = initializeWrappedToken;
