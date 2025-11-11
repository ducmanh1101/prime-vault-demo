import { ChainType, getChains, getRoutes, getTokens } from "@lifi/sdk";
import { useQuery } from "@tanstack/react-query";

import { BRIDGE_EXECUTOR_ADDRESSES, INTEGRATOR } from "../constants/main";
import configs from "../configs";
import { useSmartAccount } from "./useSMA";

const { chain } = configs.mainChain;

export const useGetChains = () => {
  return useQuery({
    queryKey: ["lifi", "chains"],
    queryFn: () => {
      return getChains({
        chainTypes: [ChainType.EVM],
      });
    },
  });
};

export const useGetTokens = () => {
  return useQuery({
    queryKey: ["lifi", "tokens"],
    queryFn: () => {
      return getTokens({
        chainTypes: [ChainType.EVM],
      });
    },
  });
};

export const useGetTokensByChain = (chainId: number) => {
  const tokens = useGetTokens();

  return {
    ...tokens,
    data: tokens?.data?.tokens[chainId] || [],
  };
};

export const useGetRoute = () => {
  const { smartAccountAddress, signerAddress } = useSmartAccount();
  return async ({
    amount,
    fromChainId,
    toToken,
    fromToken,
  }: {
    fromChainId: number;
    fromToken: string;
    amount: string;
    toToken: string;
  }) => {
    if (!smartAccountAddress || !signerAddress)
      throw new Error("No smart account address found!");
    const { routes } = await getRoutes({
      fromAddress:
        chain.id === fromChainId
          ? signerAddress
          : BRIDGE_EXECUTOR_ADDRESSES[fromChainId],
      fromChainId: fromChainId,
      fromTokenAddress: fromToken,
      fromAmount: amount,

      toAddress: smartAccountAddress,
      toChainId: chain.id,
      toTokenAddress: toToken,

      options: {
        integrator: INTEGRATOR,
        order: "FASTEST",
        allowSwitchChain: true,
      },
    });
    return routes.find((route) => route.steps.length <= 1);
  };
};
