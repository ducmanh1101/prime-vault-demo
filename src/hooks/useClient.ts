import { usePublicClient } from "wagmi";

import configs from "../configs";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const { chain } = configs.mainChain;

export const useMainChainClient = () => {
  const publicClient = usePublicClient({
    chainId: chain.id,
  });

  return publicClient;
};

export const useSwitchNetwork = () => {
  const { primaryWallet } = useDynamicContext();

  return async (chainId: number) => {
    if (!primaryWallet) throw new Error("Please connect wallet!");
    const currNet = await primaryWallet.getNetwork();
    if (!!currNet && Number(currNet) === chainId) return;
    await primaryWallet.switchNetwork(chainId);
  };
};
