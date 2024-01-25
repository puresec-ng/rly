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
exports.getMetadata = void 0;
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const anchor_1 = require("@project-serum/anchor");
const config_1 = require("../../config");
const getMetadata = ({ tokenMint, connection } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const metadataProgramAddress = new anchor_1.web3.PublicKey(mpl_token_metadata_1.PROGRAM_ADDRESS);
    const [metadata] = yield anchor_1.web3.PublicKey.findProgramAddress([
        config_1.config.pda.METADATA,
        metadataProgramAddress.toBuffer(),
        tokenMint.toBuffer(),
    ], metadataProgramAddress);
    const { data } = yield mpl_token_metadata_1.Metadata.fromAccountAddress(connection, metadata);
    data.name = data.name.replace(/\0/g, "");
    data.symbol = data.symbol.replace(/\0/g, "");
    data.uri = data.uri.replace(/\0/g, "");
    return data;
});
exports.getMetadata = getMetadata;
