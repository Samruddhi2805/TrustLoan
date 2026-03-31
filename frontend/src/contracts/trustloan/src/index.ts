import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCSERNKJA2NADIH3NSJZTVOZ5BMZD475ED3NKNPYETNU7374G4QHK7WX",
  }
} as const

/**
 * 3-tier safety verdict
 */
export type Advice = {tag: "Safe", values: void} | {tag: "Caution", values: void} | {tag: "DoNotTake", values: void};

/**
 * Employment type affects the safety threshold
 */
export type EmploymentType = {tag: "Salaried", values: void} | {tag: "SelfEmployed", values: void};


/**
 * Full loan safety evaluation result — stored on-chain per user
 */
export interface LoanEvaluation {
  advice: Advice;
  disposable_income: i64;
  disposable_pct_scaled: i64;
  dti_pct_scaled: u64;
  employment: EmploymentType;
  existing_emis: u64;
  expenses: u64;
  income: u64;
  ledger_sequence: u32;
  new_emi: u64;
  stress_disposable: i64;
  stress_dti_pct_scaled: u64;
  stress_income: u64;
  timestamp: u64;
  user: string;
}

export interface Client {
  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Contract version — bump on each upgrade.
   */
  version: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a calc_dti transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pure DTI utility — call via simulation (no auth, no state change).
   * Returns value scaled ×10000. Divide by 100 to get XX.XX%.
   */
  calc_dti: ({income, existing_emis, new_emi}: {income: u64, existing_emis: u64, new_emi: u64}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a evaluate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Evaluate loan safety and persist the result on-chain.
   */
  evaluate: ({user, income, existing_emis, new_emi, expenses, employment}: {user: string, income: u64, existing_emis: u64, new_emi: u64, expenses: u64, employment: EmploymentType}, options?: MethodOptions) => Promise<AssembledTransaction<LoanEvaluation>>

  /**
   * Construct and simulate a get_history transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_history: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<LoanEvaluation>>>

  /**
   * Construct and simulate a get_tx_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_tx_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_user_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read the total number of mathematically unique wallets (active users) from the database
   */
  get_user_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAACpDb250cmFjdCB2ZXJzaW9uIOKAlCBidW1wIG9uIGVhY2ggdXBncmFkZS4AAAAAAAd2ZXJzaW9uAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAH9QdXJlIERUSSB1dGlsaXR5IOKAlCBjYWxsIHZpYSBzaW11bGF0aW9uIChubyBhdXRoLCBubyBzdGF0ZSBjaGFuZ2UpLgpSZXR1cm5zIHZhbHVlIHNjYWxlZCDDlzEwMDAwLiBEaXZpZGUgYnkgMTAwIHRvIGdldCBYWC5YWCUuAAAAAAhjYWxjX2R0aQAAAAMAAAAAAAAABmluY29tZQAAAAAABgAAAAAAAAANZXhpc3RpbmdfZW1pcwAAAAAAAAYAAAAAAAAAB25ld19lbWkAAAAABgAAAAEAAAAG",
        "AAAAAAAAADVFdmFsdWF0ZSBsb2FuIHNhZmV0eSBhbmQgcGVyc2lzdCB0aGUgcmVzdWx0IG9uLWNoYWluLgAAAAAAAAhldmFsdWF0ZQAAAAYAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZpbmNvbWUAAAAAAAYAAAAAAAAADWV4aXN0aW5nX2VtaXMAAAAAAAAGAAAAAAAAAAduZXdfZW1pAAAAAAYAAAAAAAAACGV4cGVuc2VzAAAABgAAAAAAAAAKZW1wbG95bWVudAAAAAAH0AAAAA5FbXBsb3ltZW50VHlwZQAAAAAAAQAAB9AAAAAOTG9hbkV2YWx1YXRpb24AAA==",
        "AAAAAgAAABUzLXRpZXIgc2FmZXR5IHZlcmRpY3QAAAAAAAAAAAAABkFkdmljZQAAAAAAAwAAAAAAAAAAAAAABFNhZmUAAAAAAAAAAAAAAAdDYXV0aW9uAAAAAAAAAAAAAAAACURvTm90VGFrZQAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X2hpc3RvcnkAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6gAAB9AAAAAOTG9hbkV2YWx1YXRpb24AAA==",
        "AAAAAAAAAAAAAAAMZ2V0X3R4X2NvdW50AAAAAAAAAAEAAAAG",
        "AAAAAAAAAFdSZWFkIHRoZSB0b3RhbCBudW1iZXIgb2YgbWF0aGVtYXRpY2FsbHkgdW5pcXVlIHdhbGxldHMgKGFjdGl2ZSB1c2VycykgZnJvbSB0aGUgZGF0YWJhc2UAAAAADmdldF91c2VyX2NvdW50AAAAAAAAAAAAAQAAAAY=",
        "AAAAAgAAACxFbXBsb3ltZW50IHR5cGUgYWZmZWN0cyB0aGUgc2FmZXR5IHRocmVzaG9sZAAAAAAAAAAORW1wbG95bWVudFR5cGUAAAAAAAIAAAAAAAAAAAAAAAhTYWxhcmllZAAAAAAAAAAAAAAADFNlbGZFbXBsb3llZA==",
        "AAAAAQAAAD9GdWxsIGxvYW4gc2FmZXR5IGV2YWx1YXRpb24gcmVzdWx0IOKAlCBzdG9yZWQgb24tY2hhaW4gcGVyIHVzZXIAAAAAAAAAAA5Mb2FuRXZhbHVhdGlvbgAAAAAADwAAAAAAAAAGYWR2aWNlAAAAAAfQAAAABkFkdmljZQAAAAAAAAAAABFkaXNwb3NhYmxlX2luY29tZQAAAAAAAAcAAAAAAAAAFWRpc3Bvc2FibGVfcGN0X3NjYWxlZAAAAAAAAAcAAAAAAAAADmR0aV9wY3Rfc2NhbGVkAAAAAAAGAAAAAAAAAAplbXBsb3ltZW50AAAAAAfQAAAADkVtcGxveW1lbnRUeXBlAAAAAAAAAAAADWV4aXN0aW5nX2VtaXMAAAAAAAAGAAAAAAAAAAhleHBlbnNlcwAAAAYAAAAAAAAABmluY29tZQAAAAAABgAAAAAAAAAPbGVkZ2VyX3NlcXVlbmNlAAAAAAQAAAAAAAAAB25ld19lbWkAAAAABgAAAAAAAAARc3RyZXNzX2Rpc3Bvc2FibGUAAAAAAAAHAAAAAAAAABVzdHJlc3NfZHRpX3BjdF9zY2FsZWQAAAAAAAAGAAAAAAAAAA1zdHJlc3NfaW5jb21lAAAAAAAABgAAAAAAAAAJdGltZXN0YW1wAAAAAAAABgAAAAAAAAAEdXNlcgAAABM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    version: this.txFromJSON<u32>,
        calc_dti: this.txFromJSON<u64>,
        evaluate: this.txFromJSON<LoanEvaluation>,
        get_history: this.txFromJSON<Array<LoanEvaluation>>,
        get_tx_count: this.txFromJSON<u64>,
        get_user_count: this.txFromJSON<u64>
  }
}