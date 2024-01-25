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
exports.initializeCanonicalToken = exports.initializeCanonicalTxToken = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@project-serum/anchor");
const config_1 = require("../../../config");
const utils_1 = require("../../utils");
const { pda: { CANONICAL_MINT_AUTHORITY_PDA_SEED }, accountLayout: { CANONICAL_DATA_SPACE }, } = config_1.config;
const { PublicKey, SystemProgram: { programId }, Transaction, } = anchor_1.web3;
const initializeCanonicalTxToken = ({ canSwap, canonicalMint, canonicalData, canonicalAuthority, walletPubKey, connection, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = new Transaction();
    const [expectedMintAuthorityPDA] = yield PublicKey.findProgramAddress([CANONICAL_MINT_AUTHORITY_PDA_SEED, canonicalMint.toBuffer()], canSwap.programId);
    const canDataiX = yield canSwap.account.canonicalData.createInstruction(canonicalData, CANONICAL_DATA_SPACE);
    const initIx = canSwap.instruction.initializeCanonicalToken({
        accounts: {
            initializer: canonicalAuthority,
            canonicalMint: canonicalMint,
            pdaCanonicalMintAuthority: expectedMintAuthorityPDA,
            canonicalData: canonicalData.publicKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: programId,
        },
    });
    transaction.add(canDataiX, initIx);
    yield (0, utils_1.addTxPayerAndHash)(transaction, connection, walletPubKey);
    yield (0, utils_1.partialSignTx)(transaction, [canonicalData]);
    return transaction;
});
exports.initializeCanonicalTxToken = initializeCanonicalTxToken;
const initializeCanonicalToken = ({ canSwap, canonicalMint, canonicalData, canonicalAuthority, connection, wallet, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield (0, exports.initializeCanonicalTxToken)({
        canSwap,
        canonicalMint,
        canonicalData,
        canonicalAuthority,
        walletPubKey: wallet.publicKey,
        connection,
    });
    return (0, utils_1.sendTx)(wallet, connection, transaction, { commitment: "finalized" });
});
exports.initializeCanonicalToken = initializeCanonicalToken;
