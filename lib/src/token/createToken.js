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
exports.createToken = exports.createTokenTx = void 0;
const spl_token_1 = require("@solana/spl-token");
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const config_1 = require("../../config");
const anchor_1 = require("@project-serum/anchor");
const utils_1 = require("../utils");
const utils_2 = require("../utils");
const { Transaction } = anchor_1.web3;
const createTokenTx = ({ initialSupply, tokenData, connection, walletPubKey, freezeAuthority, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = new Transaction();
    // create mint
    const { tokenIx, tokenMint } = yield (0, utils_1.generateTokenMintInstructions)(connection, walletPubKey, walletPubKey, freezeAuthority ? walletPubKey : null, tokenData.decimals);
    // create associated account to receive tokens
    const tokenAccount = yield spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, tokenMint.publicKey, walletPubKey);
    const associatedAcctIx = yield spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, tokenMint.publicKey, tokenAccount, walletPubKey, walletPubKey);
    // send initial supply to token account
    const mintToIx = yield spl_token_1.Token.createMintToInstruction(spl_token_1.TOKEN_PROGRAM_ID, tokenMint.publicKey, tokenAccount, walletPubKey, [], spl_token_1.u64.fromBuffer(initialSupply.toArrayLike(Buffer, "le", 8)));
    // get metadata PDA
    const metadataProgramAddress = new anchor_1.web3.PublicKey(mpl_token_metadata_1.PROGRAM_ADDRESS);
    const [metadata] = yield anchor_1.web3.PublicKey.findProgramAddress([
        config_1.config.pda.METADATA,
        metadataProgramAddress.toBuffer(),
        tokenMint.publicKey.toBuffer(),
    ], metadataProgramAddress);
    // create metadata Tx
    const data = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: tokenData.uri,
        sellerFeeBasisPoints: null,
        creators: null,
        collection: null,
        uses: null,
    };
    const accounts = {
        metadata,
        mint: tokenMint.publicKey,
        mintAuthority: walletPubKey,
        updateAuthority: walletPubKey,
        payer: walletPubKey,
    };
    const createMetadataAccountArgsV2 = {
        data,
        isMutable: true,
    };
    const args = {
        createMetadataAccountArgsV2,
    };
    const createMetadataIx = (0, mpl_token_metadata_1.createCreateMetadataAccountV2Instruction)(accounts, args);
    // return tx hash, token mint, token account
    transaction.add(...tokenIx, associatedAcctIx, mintToIx, createMetadataIx);
    yield (0, utils_2.addTxPayerAndHash)(transaction, connection, walletPubKey);
    yield (0, utils_2.partialSignTx)(transaction, [tokenMint]);
    return { transaction, tokenMint: tokenMint.publicKey, tokenAccount };
});
exports.createTokenTx = createTokenTx;
const createToken = ({ initialSupply, tokenData, connection, wallet, freezeAuthority, } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const { transaction, tokenMint, tokenAccount } = yield (0, exports.createTokenTx)({
        initialSupply,
        tokenData,
        connection,
        walletPubKey: wallet.publicKey,
        freezeAuthority,
    });
    const tx = yield (0, utils_1.sendTx)(wallet, connection, transaction, {});
    return { tx, tokenMint: tokenMint, tokenAccount };
});
exports.createToken = createToken;
