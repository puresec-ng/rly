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
exports.estimateSwap = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@project-serum/anchor");
const __1 = require("../..");
const { PublicKey, Transaction } = anchor_1.web3;
const estimateSwap = ({ tokenSwap, tokenSwapInfo, amountIn, amountOut, userTransferAuthority, userSourceTokenAccount, userDestinationTokenAccount, swapSourceTokenAccount, swapDestinationTokenAccount, poolMintAccount, poolFeeAccount, walletPubKey, connection, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    // get exepcted swap authority PDA
    const [expectedSwapAuthorityPDA] = yield PublicKey.findProgramAddress([tokenSwapInfo.toBuffer()], tokenSwap.programId);
    const Ix = yield tokenSwap.instruction.swap(amountIn, amountOut, {
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
    const tx = new Transaction();
    tx.add(Ix);
    //simulate transaction return simulated state change for userSourceTokenAccount and userDestinationTokenAccount
    const { value: { err, logs, accounts }, } = yield (0, __1.simulateTransaction)(tx, walletPubKey, connection, { commitment: "confirmed", preflightCommitment: "processed" }, [userSourceTokenAccount, userDestinationTokenAccount]);
    if (err) {
        throw { message: "tx simulation error", err, logs };
    }
    else {
        const accountAInfo = yield (0, __1.accountInfoFromSim)(accounts[0]);
        const accountBInfo = yield (0, __1.accountInfoFromSim)(accounts[1]);
        return {
            amountTokenAPostSwap: accountAInfo.amount,
            amountTokenBPostSwap: accountBInfo.amount,
        };
    }
});
exports.estimateSwap = estimateSwap;
