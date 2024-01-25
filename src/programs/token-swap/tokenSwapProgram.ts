import * as anchor from "@project-serum/anchor";
import idl from "./idl.json";

import { config } from "../../../config";
const { tokenSwap } = config.programs;
const { web3 } = anchor;

export const tokenSwapProgram = async (provider: anchor.Provider) => {
  // configure anchor client
  anchor.setProvider(provider);

  // get program id from config
  const programId = new web3.PublicKey(tokenSwap);

  // return program client
  return new anchor.Program(idl as anchor.Idl, programId, provider);
};
