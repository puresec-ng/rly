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
exports.sendTx = exports.partialSignTx = exports.addTxPayerAndHash = exports.simulateTransaction = exports.generateCreateTokenAccountInstructions = exports.generateTokenMintInstructions = exports.getTokenSwapInfo = exports.getTokenAccountInfo = exports.accountInfoFromSim = exports.createSwapInfoAccount = exports.getOrCreateAssociatedAccount = exports.sRLY_PUBKEY = void 0;
const config_1 = require("../../config");
const anchor_1 = require("@project-serum/anchor");
const BufferLayout = __importStar(require("@solana/buffer-layout"));
const bytes_1 = require("@project-serum/anchor/dist/cjs/utils/bytes");
const spl_token_1 = require("@solana/spl-token");
const { PublicKey, SystemProgram, Keypair, sendAndConfirmRawTransaction, Connection, } = anchor_1.web3;
const { accountLayout: { SWAP_ACCOUNT_SPACE }, } = config_1.config;
exports.sRLY_PUBKEY = new PublicKey("RLYv2ubRMDLcGG2UyvPmnPmkfuQTsMbg4Jtygc7dmnq");
const getOrCreateAssociatedAccount = (token, pubKey) => __awaiter(void 0, void 0, void 0, function* () {
    const accountInfo = yield token.getOrCreateAssociatedAccountInfo(pubKey);
    return accountInfo.address;
});
exports.getOrCreateAssociatedAccount = getOrCreateAssociatedAccount;
const createSwapInfoAccount = (provider, fromPubkey, programId) => __awaiter(void 0, void 0, void 0, function* () {
    // Generate new keypair
    const newAccount = anchor_1.web3.Keypair.generate();
    // Create account transaction.
    const tx = new anchor_1.web3.Transaction();
    tx.add(anchor_1.web3.SystemProgram.createAccount({
        fromPubkey: fromPubkey,
        newAccountPubkey: newAccount.publicKey,
        space: SWAP_ACCOUNT_SPACE,
        lamports: yield provider.connection.getMinimumBalanceForRentExemption(SWAP_ACCOUNT_SPACE),
        programId,
    }));
    yield provider.send(tx, [newAccount]);
    return newAccount;
});
exports.createSwapInfoAccount = createSwapInfoAccount;
const publicKeyLayout = (property = "publicKey") => {
    return BufferLayout.blob(32, property);
};
const uint64Layout = (property = "uint64") => {
    return BufferLayout.blob(8, property);
};
const loadAccount = (connection, address, programId) => __awaiter(void 0, void 0, void 0, function* () {
    const accountInfo = yield connection.getAccountInfo(address);
    if (accountInfo === null) {
        throw new Error("Failed to find account");
    }
    if (!accountInfo.owner.equals(programId)) {
        throw new Error(`Invalid owner: ${JSON.stringify(accountInfo.owner)}`);
    }
    return Buffer.from(accountInfo.data);
});
const TokenSwapLayout = BufferLayout.struct([
    BufferLayout.u8("version"),
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("bumpSeed"),
    publicKeyLayout("tokenProgramId"),
    publicKeyLayout("tokenAccountA"),
    publicKeyLayout("tokenAccountB"),
    publicKeyLayout("tokenPool"),
    publicKeyLayout("mintA"),
    publicKeyLayout("mintB"),
    publicKeyLayout("feeAccount"),
    uint64Layout("tradeFeeNumerator"),
    uint64Layout("tradeFeeDenominator"),
    uint64Layout("ownerTradeFeeNumerator"),
    uint64Layout("ownerTradeFeeDenominator"),
    uint64Layout("ownerWithdrawFeeNumerator"),
    uint64Layout("ownerWithdrawFeeDenominator"),
    uint64Layout("hostFeeNumerator"),
    uint64Layout("hostFeeDenominator"),
    BufferLayout.u8("curveType"),
    BufferLayout.blob(32, "curveParameters"),
]);
const accountInfoFromSim = (account) => __awaiter(void 0, void 0, void 0, function* () {
    let data = account.data;
    data = Buffer.from(data[0], data[1]);
    const accountInfo = spl_token_1.AccountLayout.decode(data);
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = spl_token_1.u64.fromBuffer(accountInfo.amount);
    return accountInfo;
});
exports.accountInfoFromSim = accountInfoFromSim;
const getTokenAccountInfo = (connection, address) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield connection.getAccountInfo(address);
    const accountInfo = spl_token_1.AccountLayout.decode(data);
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = spl_token_1.u64.fromBuffer(accountInfo.amount);
    return accountInfo;
});
exports.getTokenAccountInfo = getTokenAccountInfo;
const getTokenSwapInfo = (connection, swapInfoPubKey, programId) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield loadAccount(connection, swapInfoPubKey, programId);
    const tokenSwapData = TokenSwapLayout.decode(data);
    // @ts-ignore
    if (!tokenSwapData.isInitialized) {
        throw new Error(`Invalid token swap state`);
    }
    // @ts-ignore
    if (!tokenSwapData.isInitialized) {
        throw new Error(`Invalid token swap state`);
    }
    const [authority] = yield PublicKey.findProgramAddress([swapInfoPubKey.toBuffer()], programId);
    // @ts-ignore
    const poolToken = new PublicKey(tokenSwapData.tokenPool);
    // @ts-ignore
    const feeAccount = new PublicKey(tokenSwapData.feeAccount);
    // @ts-ignore
    const tokenAccountA = new PublicKey(tokenSwapData.tokenAccountA);
    // @ts-ignore
    const tokenAccountB = new PublicKey(tokenSwapData.tokenAccountB);
    // @ts-ignore
    const mintA = new PublicKey(tokenSwapData.mintA);
    // @ts-ignore
    const mintB = new PublicKey(tokenSwapData.mintB);
    // @ts-ignore
    const tokenProgramId = new PublicKey(tokenSwapData.tokenProgramId);
    const tradeFeeNumerator = spl_token_1.u64.fromBuffer(
    // @ts-ignore
    tokenSwapData.tradeFeeNumerator);
    const tradeFeeDenominator = spl_token_1.u64.fromBuffer(
    // @ts-ignore
    tokenSwapData.tradeFeeDenominator);
    const ownerTradeFeeNumerator = spl_token_1.u64.fromBuffer(
    // @ts-ignore
    tokenSwapData.ownerTradeFeeNumerator);
    const ownerTradeFeeDenominator = spl_token_1.u64.fromBuffer(
    // @ts-ignore
    tokenSwapData.ownerTradeFeeDenominator);
    const ownerWithdrawFeeNumerator = spl_token_1.u64.fromBuffer(
    // @ts-ignore
    tokenSwapData.ownerWithdrawFeeNumerator);
    const ownerWithdrawFeeDenominator = spl_token_1.u64.fromBuffer(
    // @ts-ignore
    tokenSwapData.ownerWithdrawFeeDenominator);
    // @ts-ignore
    const hostFeeNumerator = spl_token_1.u64.fromBuffer(tokenSwapData.hostFeeNumerator);
    const hostFeeDenominator = spl_token_1.u64.fromBuffer(
    // @ts-ignore
    tokenSwapData.hostFeeDenominator);
    // @ts-ignore
    const curveType = tokenSwapData.curveType;
    return {
        programId,
        tokenProgramId,
        poolToken,
        feeAccount,
        authority,
        tokenAccountA,
        tokenAccountB,
        mintA,
        mintB,
        tradeFeeNumerator,
        tradeFeeDenominator,
        ownerTradeFeeNumerator,
        ownerTradeFeeDenominator,
        ownerWithdrawFeeNumerator,
        ownerWithdrawFeeDenominator,
        hostFeeNumerator,
        hostFeeDenominator,
        curveType,
    };
});
exports.getTokenSwapInfo = getTokenSwapInfo;
const generateTokenMintInstructions = (connection, walletPubKey, authority, freezeAuthority, decimals, poolTokenMintKeypair) => __awaiter(void 0, void 0, void 0, function* () {
    let tokenMint;
    // if(poolTokenMintKeypair == null){
    //   tokenMint = Keypair.generate();
    // }else{
    //   tokenMint = poolTokenMintKeypair;
    // }
    tokenMint = poolTokenMintKeypair;
    const balanceNeeded = yield spl_token_1.Token.getMinBalanceRentForExemptMint(connection);
    return {
        tokenMint,
        tokenIx: [
            SystemProgram.createAccount({
                fromPubkey: walletPubKey,
                newAccountPubkey: tokenMint.publicKey,
                lamports: balanceNeeded,
                space: spl_token_1.MintLayout.span,
                programId: spl_token_1.TOKEN_PROGRAM_ID,
            }),
            spl_token_1.Token.createInitMintInstruction(spl_token_1.TOKEN_PROGRAM_ID, tokenMint.publicKey, decimals, authority, freezeAuthority),
        ],
    };
});
exports.generateTokenMintInstructions = generateTokenMintInstructions;
const generateCreateTokenAccountInstructions = (connection, walletPubKey, mint, owner) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenAccount = Keypair.generate();
    const balanceNeeded = yield spl_token_1.Token.getMinBalanceRentForExemptAccount(connection);
    return {
        tokenAccount,
        accountIx: [
            SystemProgram.createAccount({
                fromPubkey: walletPubKey,
                newAccountPubkey: tokenAccount.publicKey,
                lamports: balanceNeeded,
                space: spl_token_1.AccountLayout.span,
                programId: spl_token_1.TOKEN_PROGRAM_ID,
            }),
            spl_token_1.Token.createInitAccountInstruction(spl_token_1.TOKEN_PROGRAM_ID, mint, tokenAccount.publicKey, owner),
        ],
    };
});
exports.generateCreateTokenAccountInstructions = generateCreateTokenAccountInstructions;
const simulateTransaction = (tx, walletPubKey, connection, opts, includeAccounts) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    tx.feePayer = walletPubKey;
    tx.recentBlockhash = (yield connection.getLatestBlockhash("finalized")).blockhash;
    const commitment = (_a = opts.commitment) !== null && _a !== void 0 ? _a : "processed";
    const message = tx._compile();
    const signData = tx.serializeMessage();
    // @ts-ignore
    const wireTransaction = tx._serialize(signData);
    const encodedTransaction = wireTransaction.toString("base64");
    const config = { encoding: "base64", commitment };
    if (includeAccounts) {
        const addresses = (Array.isArray(includeAccounts) ? includeAccounts : message.nonProgramIds())
            // @ts-ignore
            .map((key) => key.toBase58());
        config["accounts"] = {
            encoding: "base64",
            addresses,
        };
    }
    const args = [encodedTransaction, config];
    // @ts-ignore
    const res = yield connection._rpcRequest("simulateTransaction", args);
    if (res.error) {
        throw new Error("failed to simulate transaction: " + res.error.message);
    }
    return res.result;
});
exports.simulateTransaction = simulateTransaction;
const addTxPayerAndHash = (transaction, connection, payer) => __awaiter(void 0, void 0, void 0, function* () {
    // add fee payer and recent block hash to tx
    transaction.feePayer = payer;
    const { blockhash, lastValidBlockHeight } = yield connection.getLatestBlockhash("finalized");
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    return transaction;
});
exports.addTxPayerAndHash = addTxPayerAndHash;
//partially sign tx with array of Keypairs
const partialSignTx = (transaction, signers) => __awaiter(void 0, void 0, void 0, function* () {
    // partially sign setup transaction with generated accounts
    transaction.partialSign(...signers);
    return transaction;
});
exports.partialSignTx = partialSignTx;
//sign tx with given wallet and broadcast tx
const sendTx = (wallet, connection, transaction, txOpts) => __awaiter(void 0, void 0, void 0, function* () {
    //sign tx with wallet
    yield wallet.signTransaction(transaction);
    const rawTx = transaction.serialize();
    const { lastValidBlockHeight, signature, recentBlockhash } = transaction;
    const confirmationStrategy = {
        lastValidBlockHeight,
        signature: bytes_1.bs58.encode(signature),
        blockhash: recentBlockhash,
    };
    return yield sendAndConfirmRawTransaction(connection, rawTx, confirmationStrategy, txOpts);
});
exports.sendTx = sendTx;
