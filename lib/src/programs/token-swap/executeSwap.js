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
exports.executeSwap = exports.executeSwapTx = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@project-serum/anchor");
const utils_1 = require("../../utils");
const { PublicKey, SystemProgram: { programId }, Transaction, } = anchor_1.web3;
const executeSwapTx = ({ tokenSwap, tokenSwapInfo, amountIn, amountOut, userTransferAuthority, userSourceTokenAccount, userDestinationTokenAccount, swapSourceTokenAccount, swapDestinationTokenAccount, poolMintAccount, poolFeeAccount, walletPubKey, connection, } = {}, { userTransferAuthorityOwner } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = new Transaction();
    // get exepcted swap authority PDA
    const [expectedSwapAuthorityPDA] = yield PublicKey.findProgramAddress([tokenSwapInfo.toBuffer()], tokenSwap.programId);
    const ix = tokenSwap.instruction.swap(amountIn, amountOut, {
        accounts: {
            tokenSwap: tokenSwapInfo,
            swapAuthority: expectedSwapAuthorityPDA,
            userTransferAuthority,
            source: userSourceTokenAccount,
            destination: userDestinationTokenAccount,
            swapSource: swapSourceTokenAccount,
            swapDestination: swapDestinationTokenAccount,
            poolMint: poolMintAccount,
            poolFee: poolFeeAccount,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
    transaction.add(ix);
    yield (0, utils_1.addTxPayerAndHash)(transaction, connection, walletPubKey);
    userTransferAuthorityOwner &&
        (yield (0, utils_1.partialSignTx)(transaction, [userTransferAuthorityOwner.payer]));
    return transaction;
});
exports.executeSwapTx = executeSwapTx;
const executeSwap = ({ tokenSwap, tokenSwapInfo, amountIn, amountOut, userTransferAuthority, userSourceTokenAccount, userDestinationTokenAccount, swapSourceTokenAccount, swapDestinationTokenAccount, poolMintAccount, poolFeeAccount, wallet, connection, } = {}, { userTransferAuthorityOwner } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield (0, exports.executeSwapTx)({
        tokenSwap,
        tokenSwapInfo,
        amountIn,
        amountOut,
        userTransferAuthority,
        userSourceTokenAccount,
        userDestinationTokenAccount,
        swapSourceTokenAccount,
        swapDestinationTokenAccount,
        poolMintAccount,
        poolFeeAccount,
        walletPubKey: wallet.publicKey,
        connection,
    }, { userTransferAuthorityOwner });
    return (0, utils_1.sendTx)(wallet, connection, transaction, {
        commitment: "finalized",
    });
});
exports.executeSwap = executeSwap;
