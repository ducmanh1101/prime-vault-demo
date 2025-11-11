import type { Hex } from "viem";

export type ChainType = "in-chain" | "cross-chains";

interface DepositSABase {
  fromChainId: number;
  toToken: Hex;
}

export interface DepositCrossSA extends DepositSABase {
  tool: string;
  data: Hex;
  fromToken: Hex;
  fromAmount: string;
  toChainId: number;
  value?: bigint;
}

export interface DepositSA extends DepositSABase {
  amount: string;
}

export interface DepositSAResponse {
  amount: string;
  token: Hex;
}

export type StakeSAParams = DepositSAResponse;
