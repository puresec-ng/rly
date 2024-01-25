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
exports.addMetadata = exports.addMetadataTx = void 0;
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const config_1 = require("../../config");
const anchor_1 = require("@project-serum/anchor");
const utils_1 = require("../utils");
const { Transaction, PublicKey } = anchor_1.web3;
const addMetadataTx = ({ tokenMint, tokenData, connection, walletPubKey } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = new Transaction();
    const metadataProgramAddress = new PublicKey(mpl_token_metadata_1.PROGRAM_ADDRESS);
    const [metadata] = yield PublicKey.findProgramAddress([
        config_1.config.pda.METADATA,
        metadataProgramAddress.toBuffer(),
        tokenMint.publicKey.toBuffer(),
    ], metadataProgramAddress);
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
    transaction.add(createMetadataIx);
    yield (0, utils_1.addTxPayerAndHash)(transaction, connection, walletPubKey);
    return transaction;
});
exports.addMetadataTx = addMetadataTx;
const addMetadata = ({ tokenMint, tokenData, connection, wallet } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield (0, exports.addMetadataTx)({
        tokenMint,
        tokenData,
        connection,
        walletPubKey: wallet.publicKey,
    });
    return (0, utils_1.sendTx)(wallet, connection, transaction, { commitment: "finalized" });
});
exports.addMetadata = addMetadata;
