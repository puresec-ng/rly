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
exports.swapWrappedForCanonical = exports.swapWrappedForCanonicalTx = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@project-serum/anchor");
const config_1 = require("../../../config");
const utils_1 = require("../../utils");
const { pda: { CANONICAL_MINT_AUTHORITY_PDA_SEED, TOKEN_ACCOUNT_PDA_SEED }, } = config_1.config;
const { Transaction } = anchor_1.web3;
const swapWrappedForCanonicalTx = ({ canSwap, canonicalMint, wrappedMint, canonicalData, wrappedData, sourceTokenAccount, destinationTokenAccount, destinationAmount, walletPubKey, connection, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = new Transaction();
    const [expectedMintAuthorityPDA] = yield anchor_1.web3.PublicKey.findProgramAddress([CANONICAL_MINT_AUTHORITY_PDA_SEED, canonicalMint.toBuffer()], canSwap.programId);
    const [wrappedTokenAccount] = yield anchor_1.web3.PublicKey.findProgramAddress([TOKEN_ACCOUNT_PDA_SEED, canonicalMint.toBuffer(), wrappedMint.toBuffer()], canSwap.programId);
    const ix = canSwap.instruction.swapWrappedForCanonical(destinationAmount, {
        accounts: {
            user: walletPubKey,
            destinationCanonicalTokenAccount: destinationTokenAccount,
            canonicalMint: canonicalMint,
            pdaCanonicalMintAuthority: expectedMintAuthorityPDA,
            sourceWrappedTokenAccount: sourceTokenAccount,
            wrappedTokenAccount,
            canonicalData: canonicalData,
            wrappedData: wrappedData,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
    transaction.add(ix);
    yield (0, utils_1.addTxPayerAndHash)(transaction, connection, walletPubKey);
    return transaction;
});
exports.swapWrappedForCanonicalTx = swapWrappedForCanonicalTx;
const swapWrappedForCanonical = ({ canSwap, canonicalMint, wrappedMint, canonicalData, wrappedData, sourceTokenAccount, destinationTokenAccount, destinationAmount, wallet, connection, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield (0, exports.swapWrappedForCanonicalTx)({
        canSwap,
        canonicalMint,
        wrappedMint,
        canonicalData,
        wrappedData,
        sourceTokenAccount,
        destinationTokenAccount,
        destinationAmount,
        walletPubKey: wallet.publicKey,
        connection,
    });
    return (0, utils_1.sendTx)(wallet, connection, transaction, { commitment: "finalized" });
});
exports.swapWrappedForCanonical = swapWrappedForCanonical;
