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
exports.initializeLinearPriceCurve = exports.initializeLinearPriceCurveTx = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@project-serum/anchor");
const config_1 = require("../../../config");
const utils_1 = require("../../utils");
const web3_js_1 = require("@solana/web3.js");
const { accountLayout: { SWAP_ACCOUNT_SPACE }, } = config_1.config;
const PRIORITY_RATE = 200000; // MICRO_LAMPORTS
const PRIORITY_FEE_IX = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_RATE });
const { PublicKey, Transaction } = anchor_1.web3;
//generate partially signed transaction objects for initializing tbc
const initializeLinearPriceCurveTx = ({ tokenSwap, slopeNumerator, slopeDenominator, initialTokenAPriceNumerator, initialTokenAPriceDenominator, callerTokenBAccount, tokenSwapInfo, tokenA, tokenB, poolTokenDecimals, walletPubKey, connection, initialTokenBLiquidity, } = {}, { callerTokenBAccountOwner, adminAccountOwner, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    // initialize required transactions, split into two transactions as combined the transations are > the 1232 bytes limit for solana
    // setupTransaction creates required accounts for tbc
    let setupTransaction = new Transaction();
    setupTransaction.add(PRIORITY_FEE_IX);
    //initTbcTransaciton initializes the new tbc
    let initTbcTransaction = new Transaction();
    initTbcTransaction.add(PRIORITY_FEE_IX);
    // get exepcted swap authority PDA
    const [expectedSwapAuthorityPDA] = yield PublicKey.findProgramAddress([tokenSwapInfo.publicKey.toBuffer()], tokenSwap.programId);
    // get create pooltoken mint ix
    const { tokenIx, tokenMint: poolTokenMint } = yield (0, utils_1.generateTokenMintInstructions)(connection, walletPubKey, expectedSwapAuthorityPDA, null, poolTokenDecimals);
    // get token account create instructions for swap pda
    const { tokenAccount: tokenATokenAccount, accountIx: createTokenATokenAccountIx, } = yield (0, utils_1.generateCreateTokenAccountInstructions)(connection, walletPubKey, tokenA, expectedSwapAuthorityPDA);
    const { tokenAccount: tokenBTokenAccount, accountIx: createTokenBTokenAccountIx, } = yield (0, utils_1.generateCreateTokenAccountInstructions)(connection, walletPubKey, tokenB, expectedSwapAuthorityPDA);
    //transfer initial token_b liquidity into the swap token_b token account
    const tokenBTransferIx = spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, callerTokenBAccount, tokenBTokenAccount.publicKey, callerTokenBAccountOwner
        ? callerTokenBAccountOwner.publicKey
        : walletPubKey, [], spl_token_1.u64.fromBuffer(initialTokenBLiquidity.toArrayLike(Buffer, "le", 8)));
    // create token accounts for fees and pool tokens owned by calling account (can't use associated token account as two accounts req'd)
    const { tokenAccount: feeAccount, accountIx: createFeeAccountIx } = yield (0, utils_1.generateCreateTokenAccountInstructions)(connection, walletPubKey, poolTokenMint.publicKey, adminAccountOwner ? adminAccountOwner : walletPubKey);
    const { tokenAccount: destinationAccount, accountIx: createDestinationAccountIx, } = yield (0, utils_1.generateCreateTokenAccountInstructions)(connection, walletPubKey, poolTokenMint.publicKey, adminAccountOwner ? adminAccountOwner : walletPubKey);
    // create the tokenswapinfo data account to store swap data
    const tokenSwapInfoIx = anchor_1.web3.SystemProgram.createAccount({
        fromPubkey: walletPubKey,
        newAccountPubkey: tokenSwapInfo.publicKey,
        space: SWAP_ACCOUNT_SPACE,
        lamports: yield connection.getMinimumBalanceForRentExemption(SWAP_ACCOUNT_SPACE),
        programId: tokenSwap.programId,
    });
    //initiliaze the TBC
    const initCurveIx = tokenSwap.instruction.initializeLinearPrice(slopeNumerator, slopeDenominator, initialTokenAPriceNumerator, initialTokenAPriceDenominator, {
        accounts: {
            tokenSwap: tokenSwapInfo.publicKey,
            swapAuthority: expectedSwapAuthorityPDA,
            tokenA: tokenATokenAccount.publicKey,
            tokenB: tokenBTokenAccount.publicKey,
            pool: poolTokenMint.publicKey,
            fee: feeAccount.publicKey,
            destination: destinationAccount.publicKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
    // populate setup transaction
    setupTransaction.add(...tokenIx, ...createTokenATokenAccountIx, ...createTokenBTokenAccountIx, tokenBTransferIx);
    // populate init tbc transaction
    initTbcTransaction.add(...createFeeAccountIx, ...createDestinationAccountIx, tokenSwapInfoIx, initCurveIx);
    //add tx payer and recent blockchash to setup transaction
    yield (0, utils_1.addTxPayerAndHash)(setupTransaction, connection, walletPubKey);
    // partially sign setup transaction with generated accounts
    setupTransaction = yield (0, utils_1.partialSignTx)(setupTransaction, [
        poolTokenMint,
        tokenATokenAccount,
        tokenBTokenAccount,
        ...(callerTokenBAccountOwner ? [callerTokenBAccountOwner.payer] : []),
    ]);
    //add tx payer and recent blockchash to init tbc transaction
    yield (0, utils_1.addTxPayerAndHash)(initTbcTransaction, connection, walletPubKey);
    //partially sign init tbc transaction with generated accounts
    initTbcTransaction = yield (0, utils_1.partialSignTx)(initTbcTransaction, [
        tokenSwapInfo,
        feeAccount,
        destinationAccount,
    ]);
    return { setupTransaction, initTbcTransaction };
});
exports.initializeLinearPriceCurveTx = initializeLinearPriceCurveTx;
//generate partially signed transaction objects for initializing tbc
const initializeLinearPriceCurve = ({ tokenSwap, slopeNumerator, slopeDenominator, initialTokenAPriceNumerator, initialTokenAPriceDenominator, callerTokenBAccount, tokenSwapInfo, tokenA, tokenB, poolTokenDecimals, wallet, connection, initialTokenBLiquidity, } = {}, { callerTokenBAccountOwner, adminAccountOwner, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const { setupTransaction, initTbcTransaction } = yield (0, exports.initializeLinearPriceCurveTx)({
        tokenSwap,
        slopeNumerator,
        slopeDenominator,
        initialTokenAPriceNumerator,
        initialTokenAPriceDenominator,
        callerTokenBAccount,
        tokenSwapInfo,
        tokenA,
        tokenB,
        poolTokenDecimals,
        walletPubKey: wallet.publicKey,
        connection,
        initialTokenBLiquidity,
    }, { callerTokenBAccountOwner, adminAccountOwner });
    //send setup tx await tx finality
    const setupTx = yield (0, utils_1.sendTx)(wallet, connection, setupTransaction, {
        commitment: "finalized",
    });
    //send init tbc tx await tx finality
    const tx = yield (0, utils_1.sendTx)(wallet, connection, initTbcTransaction, {
        commitment: "finalized",
    });
    return { tx, setupTx };
});
exports.initializeLinearPriceCurve = initializeLinearPriceCurve;
