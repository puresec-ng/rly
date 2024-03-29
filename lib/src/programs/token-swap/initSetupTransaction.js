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
exports.initSetupTransaction = exports.initSetupTransactionTx = void 0;
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
const initSetupTransactionTx = ({ tokenSwap, slopeNumerator, slopeDenominator, initialTokenAPriceNumerator, initialTokenAPriceDenominator, callerTokenBAccount, tokenSwapInfo, tokenA, tokenB, poolTokenDecimals, walletPubKey, connection, initialTokenBLiquidity, poolTokenMintKeypair, tokenATokenAccountKeypair, tokenBTokenAccountKeypair } = {}, { callerTokenBAccountOwner, adminAccountOwner, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    // initialize required transactions, split into two transactions as combined the transations are > the 1232 bytes limit for solana
    // setupTransaction creates required accounts for tbc
    let setupTransaction = new Transaction();
    setupTransaction.add(PRIORITY_FEE_IX);
    const [expectedSwapAuthorityPDA] = yield PublicKey.findProgramAddress([tokenSwapInfo.publicKey.toBuffer()], tokenSwap.programId);
    // get create pooltoken mint ix
    const { tokenIx, tokenMint: poolTokenMint } = yield (0, utils_1.generateTokenMintInstructions)(connection, walletPubKey, expectedSwapAuthorityPDA, null, poolTokenDecimals, poolTokenMintKeypair);
    // get token account create instructions for swap pda
    const { tokenAccount: tokenATokenAccount, accountIx: createTokenATokenAccountIx, } = yield (0, utils_1.generateCreateTokenAccountInstructions)(connection, walletPubKey, tokenA, expectedSwapAuthorityPDA, tokenATokenAccountKeypair);
    const { tokenAccount: tokenBTokenAccount, accountIx: createTokenBTokenAccountIx, } = yield (0, utils_1.generateCreateTokenAccountInstructions)(connection, walletPubKey, tokenB, expectedSwapAuthorityPDA, tokenBTokenAccountKeypair);
    //transfer initial token_b liquidity into the swap token_b token account
    const tokenBTransferIx = spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, callerTokenBAccount, tokenBTokenAccount.publicKey, callerTokenBAccountOwner
        ? callerTokenBAccountOwner.publicKey
        : walletPubKey, [], spl_token_1.u64.fromBuffer(initialTokenBLiquidity.toArrayLike(Buffer, "le", 8)));
    // create token accounts for fees and pool tokens owned by calling account (can't use associated token account as two accounts req'd)
    const { tokenAccount: feeAccount, accountIx: createFeeAccountIx } = yield (0, utils_1.generateCreateTokenAccountInstructions)(connection, walletPubKey, poolTokenMint.publicKey, adminAccountOwner ? adminAccountOwner : walletPubKey, web3_js_1.Keypair.generate());
    // populate setup transaction
    setupTransaction.add(...tokenIx, ...createTokenATokenAccountIx, ...createTokenBTokenAccountIx, tokenBTransferIx);
    //add tx payer and recent blockchash to setup transaction
    yield (0, utils_1.addTxPayerAndHash)(setupTransaction, connection, walletPubKey);
    // partially sign setup transaction with generated accounts
    setupTransaction = yield (0, utils_1.partialSignTx)(setupTransaction, [
        poolTokenMint,
        tokenATokenAccount,
        tokenBTokenAccount,
        ...(callerTokenBAccountOwner ? [callerTokenBAccountOwner.payer] : []),
    ]);
    return { setupTransaction };
});
exports.initSetupTransactionTx = initSetupTransactionTx;
//generate partially signed transaction objects for initializing tbc
const initSetupTransaction = ({ tokenSwap, slopeNumerator, slopeDenominator, initialTokenAPriceNumerator, initialTokenAPriceDenominator, callerTokenBAccount, tokenSwapInfo, tokenA, tokenB, poolTokenDecimals, wallet, connection, initialTokenBLiquidity, poolTokenMintKeypair, tokenATokenAccountKeypair, tokenBTokenAccountKeypair } = {}, { callerTokenBAccountOwner, adminAccountOwner, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const { setupTransaction } = yield (0, exports.initSetupTransactionTx)({
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
        poolTokenMintKeypair,
        tokenATokenAccountKeypair,
        tokenBTokenAccountKeypair
    }, { callerTokenBAccountOwner, adminAccountOwner });
    //send setup tx await tx finality
    const setupTx = yield (0, utils_1.sendTx)(wallet, connection, setupTransaction, {
        commitment: "finalized",
    });
    return { setupTx };
});
exports.initSetupTransaction = initSetupTransaction;
