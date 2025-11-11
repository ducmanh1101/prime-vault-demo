import { berachain, berachainBepolia, type Chain } from "wagmi/chains";
import type { Env } from "./env";
import type { Hex } from "viem";

type Conf = {
  rpc: string;
  chain: Chain;
  contractAddress: Hex;
};
const conf: Record<Env, Conf> = {
  development: {
    rpc: "https://sleek-cosmopolitan-star.bera-bepolia.quiknode.pro/62806d60a71d1bf8c7ea0941ac951db209fead9b/",
    chain: berachainBepolia,
    contractAddress: "0xFe13cB7498e81A5f0a22693404865F33a621FE03",
  },

  staging: {
    rpc: "https://bepolia.rpc.berachain.com/",
    chain: berachainBepolia,
    contractAddress: "0xFe13cB7498e81A5f0a22693404865F33a621FE03",
  },

  production: {
    rpc: "https://rpc.berachain.com/",
    chain: berachain,
    contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  },
};

export default conf;
