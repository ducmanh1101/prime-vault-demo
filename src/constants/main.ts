import { zeroAddress, type Hex } from "viem";
import { arbitrum, berachain, linea } from "viem/chains";

export const INTEGRATOR = "prime-vault-testnet";
export const STAKING_ADDRESS =
  "0xc355894d819EADba7C70B3281fD7305198DcD90a" as Hex;

export const BRIDGE_EXECUTOR_ADDRESSES: Record<number, Hex> = {
  [linea.id]: "0x938A8D9F029176FdD92d0451FDbF0F25e0110aA0",
  [arbitrum.id]: "0x9e48cCA2102e083E3471c661e11D35E15abf471E",
};

export const ALLOWED_CHAINS = [berachain, linea, arbitrum];

export const TOKEN_POOLS: Record<
  number,
  { address: Hex; decimals: number; name: string; symbol: string }
> = {
  1: {
    address: zeroAddress,
    decimals: 18,
    name: "Berachain",
    symbol: "BERA",
  },
  2: {
    address: "0x549943e04f40284185054145c6E4e9568C1D3241",
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC.e",
  },
  3: {
    address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
    decimals: 8,
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
  },
  4: {
    address: "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590",
    decimals: 18,
    name: "Wrapped Ether",
    symbol: "WETH",
  },
};
