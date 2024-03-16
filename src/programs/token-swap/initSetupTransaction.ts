import { Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Program, web3, BN, Wallet } from "@project-serum/anchor";
import { config } from "../../../config";
import {
  generateTokenMintInstructions,
  generateCreateTokenAccountInstructions,
  sendTx,
  partialSignTx,
  addTxPayerAndHash,
} from "../../utils";
import {ComputeBudgetProgram, Keypair} from "@solana/web3.js";

const {
  accountLayout: { SWAP_ACCOUNT_SPACE },
} = config;
const PRIORITY_RATE = 200000; // MICRO_LAMPORTS
const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({microLamports: PRIORITY_RATE});
const { PublicKey, Transaction } = web3;

interface initializeLinearPriceCurveTxResults {
  setupTransaction: web3.Transaction;
}

interface initializeLinearPriceCurveResults {
  setupTx: web3.TransactionSignature;
}

interface initializeLinearPriceCurveTxParams {
  tokenSwap: Program;
  slopeNumerator: BN;
  slopeDenominator: BN;
  initialTokenAPriceNumerator: BN;
  initialTokenAPriceDenominator: BN;
  callerTokenBAccount: web3.PublicKey;
  tokenSwapInfo: web3.Keypair;
  tokenA: web3.PublicKey;
  tokenB: web3.PublicKey;
  poolTokenDecimals: number;
  walletPubKey: web3.PublicKey;
  connection: any;
  initialTokenBLiquidity: BN;
  poolTokenMintKeypair: web3.Keypair;
}

interface initializeLinearPriceCurveParams {
  tokenSwap: Program;
  slopeNumerator: BN;
  slopeDenominator: BN;
  initialTokenAPriceNumerator: BN;
  initialTokenAPriceDenominator: BN;
  callerTokenBAccount: web3.PublicKey;
  tokenSwapInfo: web3.Keypair;
  tokenA: web3.PublicKey;
  tokenB: web3.PublicKey;
  poolTokenDecimals: number;
  wallet: Wallet;
  connection: any;
  initialTokenBLiquidity: BN;
    poolTokenMintKeypair: web3.Keypair;
}

interface initializeLinearPriceCurveOpts {
  //if the owner of the caller tokenB account is not the caller wallet account include the tokenB owner wallet here
  //do not use if calling from web or mobile
  callerTokenBAccountOwner?: Wallet;
  //if the owner of the fee token account and destination token account is not the caller wallet include the admin owner public key here
  adminAccountOwner?: web3.PublicKey;
}

//generate partially signed transaction objects for initializing tbc

export const initSetupTransactionTx = async (
  {
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
    walletPubKey,
    connection,
    initialTokenBLiquidity,
      poolTokenMintKeypair,
  } = {} as initializeLinearPriceCurveTxParams,
  {
    callerTokenBAccountOwner,
    adminAccountOwner,
  } = {} as initializeLinearPriceCurveOpts
): Promise<initializeLinearPriceCurveTxResults> => {
  // initialize required transactions, split into two transactions as combined the transations are > the 1232 bytes limit for solana

  // setupTransaction creates required accounts for tbc
  let setupTransaction = new Transaction();
  setupTransaction.add(PRIORITY_FEE_IX);


  const [expectedSwapAuthorityPDA] = await PublicKey.findProgramAddress(
    [tokenSwapInfo.publicKey.toBuffer()],
    tokenSwap.programId
  );

  // get create pooltoken mint ix

  const { tokenIx, tokenMint: poolTokenMint } =
    await generateTokenMintInstructions(
      connection,
      walletPubKey,
      expectedSwapAuthorityPDA,
      null,
      poolTokenDecimals,
        poolTokenMintKeypair
    );

  // get token account create instructions for swap pda

  const {
    tokenAccount: tokenATokenAccount,
    accountIx: createTokenATokenAccountIx,
  } = await generateCreateTokenAccountInstructions(
    connection,
    walletPubKey,
    tokenA,
    expectedSwapAuthorityPDA
  );
  const {
    tokenAccount: tokenBTokenAccount,
    accountIx: createTokenBTokenAccountIx,
  } = await generateCreateTokenAccountInstructions(
    connection,
    walletPubKey,
    tokenB,
    expectedSwapAuthorityPDA
  );

  //transfer initial token_b liquidity into the swap token_b token account

  const tokenBTransferIx = Token.createTransferInstruction(
    TOKEN_PROGRAM_ID,
    callerTokenBAccount,
    tokenBTokenAccount.publicKey,
    callerTokenBAccountOwner
      ? callerTokenBAccountOwner.publicKey
      : walletPubKey,
    [],
    u64.fromBuffer(initialTokenBLiquidity.toArrayLike(Buffer, "le", 8))
  );

  // create token accounts for fees and pool tokens owned by calling account (can't use associated token account as two accounts req'd)

  const { tokenAccount: feeAccount, accountIx: createFeeAccountIx } =
    await generateCreateTokenAccountInstructions(
      connection,
      walletPubKey,
      poolTokenMint.publicKey,
      adminAccountOwner ? adminAccountOwner : walletPubKey
    );



    // populate setup transaction

    setupTransaction.add(
        ...tokenIx,
        ...createTokenATokenAccountIx,
        ...createTokenBTokenAccountIx,
        tokenBTransferIx
    );

  //add tx payer and recent blockchash to setup transaction


  await addTxPayerAndHash(setupTransaction, connection, walletPubKey);

  // partially sign setup transaction with generated accounts

  setupTransaction = await partialSignTx(setupTransaction, [
    poolTokenMint,
    tokenATokenAccount,
    tokenBTokenAccount,
    ...(callerTokenBAccountOwner ? [callerTokenBAccountOwner.payer] : []),
  ]);


  return { setupTransaction };
};

//generate partially signed transaction objects for initializing tbc

export const initSetupTransaction = async (
  {
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
    wallet,
    connection,
    initialTokenBLiquidity,
      poolTokenMintKeypair,
  } = {} as initializeLinearPriceCurveParams,
  {
    callerTokenBAccountOwner,
    adminAccountOwner,
  } = {} as initializeLinearPriceCurveOpts
): Promise<initializeLinearPriceCurveResults> => {
  const { setupTransaction} =
    await initSetupTransactionTx(
      {
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
      },
      { callerTokenBAccountOwner, adminAccountOwner }
    );

  //send setup tx await tx finality
  const setupTx = await sendTx(wallet, connection, setupTransaction, {
    commitment: "finalized",
  });


  return {setupTx };
};
