import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  berasigWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createZeroDevPaymasterClient } from "@zerodev/sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { linea, berachain, arbitrum } from "viem/chains";
import configs from ".";

export const projectId = "54538b1e6d3f2f6a91084ed8f25b7830";
const { chain } = configs.mainChain;

export const wagmiConfig = getDefaultConfig({
  appName: "JIKO Airdrop App",
  projectId,
  chains: [linea, berachain, arbitrum],
  multiInjectedProviderDiscovery: false,
  wallets: [
    {
      groupName: "Suggested",
      wallets: [berasigWallet],
    },
    {
      groupName: "Others",
      wallets: [rainbowWallet, walletConnectWallet, metaMaskWallet],
    },
  ],
  transports: {
    [linea.id]: http(),
    [berachain.id]: http(),
    [arbitrum.id]: http(),
  },
});

export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

export const walletClient = createWalletClient({
  chain,
  transport: http(),
});

export const paymasterClient = createZeroDevPaymasterClient({
  chain,
  transport: http(import.meta.env.VITE_ZERODEV_RPC),
});
