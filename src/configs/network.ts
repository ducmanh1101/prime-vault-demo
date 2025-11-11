import type { Env } from "./env";

type Conf = {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

const conf: Record<Env, Conf> = {
  development: {
    chainId: "80069",
    chainName: "Berachain Bepolia",
    nativeCurrency: {
      name: "Berachain",
      symbol: "BERA",
      decimals: 18,
    },
    rpcUrls: ["https://bepolia.rpc.berachain.com"],
    blockExplorerUrls: ["https://bepolia.beratrail.io"],
  },
  staging: {
    chainId: "80094",
    chainName: "Berachain Mainnet",
    nativeCurrency: {
      name: "Berachain",
      symbol: "BERA",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.berachain.com/"],
    blockExplorerUrls: ["https://berascan.com/"],
  },
  production: {
    chainId: "80094",
    chainName: "Berachain Mainnet",
    nativeCurrency: {
      name: "Berachain",
      symbol: "BERA",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.berachain.com/"],
    blockExplorerUrls: ["https://berascan.com/"],
  },
};

export default conf;
