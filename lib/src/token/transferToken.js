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
exports.transferToken = exports.transferTokenTx = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@project-serum/anchor");
const utils_1 = require("../utils");
const { Transaction } = anchor_1.web3;
const transferTokenTx = ({ from, to, amount, connection, walletPubKey } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = new Transaction();
    // get token transfer instructions
    const ix = spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, from, to, walletPubKey, [], amount);
    // add ix to transaction, send tx, returns tx
    transaction.add(ix);
    yield (0, utils_1.addTxPayerAndHash)(transaction, connection, walletPubKey);
    return transaction;
});
exports.transferTokenTx = transferTokenTx;
const transferToken = ({ from, to, amount, connection, wallet } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield (0, exports.transferTokenTx)({
        from,
        to,
        amount,
        connection,
        walletPubKey: wallet.publicKey,
    });
    return (0, utils_1.sendTx)(wallet, connection, transaction, { commitment: "finalized" });
});
exports.transferToken = transferToken;
