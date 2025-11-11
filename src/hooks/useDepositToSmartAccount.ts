import {
  erc20Abi,
  isAddressEqual,
  maxUint128,
  zeroAddress,
  type Hex,
} from "viem";
import { usePublicClient, useWriteContract } from "wagmi";
import { useSmartAccount } from "./useSMA";
import {
  executeRoute,
  type ExtendedTransactionInfo,
  type Route,
} from "@lifi/sdk";

import { useMainChainClient } from "./useClient";
import type {
  DepositCrossSA,
  DepositSA,
  DepositSAResponse,
} from "./deposit.SA";
import { waitForTransactionStatus } from "./waitForTransactionStatus";

import { BRIDGE_EXECUTOR_ABI } from "../constants/abi";
import { BRIDGE_EXECUTOR_ADDRESSES } from "../constants/main";
import {
  useDynamicContext,
  useSwitchNetwork,
} from "@dynamic-labs/sdk-react-core";

export const useDepositToSmartAccount = () => {
  const { writeContractAsync } = useWriteContract();
  const { smartAccountAddress } = useSmartAccount();
  const mainChainClient = useMainChainClient();
  const { primaryWallet } = useDynamicContext();
  const switchNetwork = useSwitchNetwork();

  return async (deposit: DepositSA): Promise<DepositSAResponse> => {
    if (!smartAccountAddress) throw new Error("Smart account not ready!");
    if (!primaryWallet) throw new Error("Please connect wallet!");
    await switchNetwork({
      network: deposit.fromChainId,
      wallet: primaryWallet,
    });

    const hash = await writeContractAsync({
      abi: erc20Abi,
      address: deposit.toToken,
      functionName: "transfer",
      args: [smartAccountAddress, BigInt(deposit.amount)],
      chainId: deposit.fromChainId,
    });

    await mainChainClient?.waitForTransactionReceipt({ hash });
    return { amount: deposit.amount, token: deposit.toToken };
  };
};

export const useBridgeToSmartAccount = () => {
  const { writeContractAsync } = useWriteContract();
  const { smartAccountAddress, signerAddress } = useSmartAccount();
  const mainChainClient = useMainChainClient();
  const pubClient = usePublicClient();
  const { primaryWallet } = useDynamicContext();
  const switchNetwork = useSwitchNetwork();

  return async (deposit: DepositCrossSA): Promise<DepositSAResponse> => {
    if (!smartAccountAddress) throw new Error("Smart account not ready!");
    if (!signerAddress) throw new Error("Please connect wallet!");
    if (!pubClient) throw new Error("Please connect wallet!");
    if (!primaryWallet) throw new Error("Please connect wallet!");
    await switchNetwork({
      network: deposit.fromChainId,
      wallet: primaryWallet,
    });

    const bridgeExecutor = BRIDGE_EXECUTOR_ADDRESSES[deposit.fromChainId];
    if (!isAddressEqual(deposit.fromToken, zeroAddress)) {
      const allowance = await pubClient.readContract({
        abi: erc20Abi,
        address: deposit.fromToken,
        functionName: "allowance",
        args: [signerAddress, bridgeExecutor],
      });

      if (!allowance || allowance < BigInt(deposit.fromAmount)) {
        const txApprove = await writeContractAsync({
          abi: erc20Abi,
          address: deposit.fromToken,
          functionName: "approve",
          args: [bridgeExecutor, maxUint128],
        });
        await pubClient.waitForTransactionReceipt({ hash: txApprove });
      }
    }

    const txBridge = await writeContractAsync({
      abi: BRIDGE_EXECUTOR_ABI,
      address: bridgeExecutor,
      functionName: "execute",
      args: [deposit.data],
      chainId: deposit.fromChainId,
      value: deposit.value,
    });

    const result = await waitForTransactionStatus({
      txHash: txBridge,
      bridge: deposit.tool,
      fromChain: deposit.fromChainId,
      toChain: deposit.toChainId,
    });
    const receiving = result.receiving as ExtendedTransactionInfo;
    let amount: string;

    if (!receiving.amount) {
      if (!mainChainClient) throw new Error("Please connect wallet!");
      const balanceToken = await mainChainClient.readContract({
        address: deposit.toToken,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [smartAccountAddress],
      });
      amount = balanceToken.toString();
    } else {
      amount = receiving.amount;
    }

    if (!amount) throw new Error("No token balance");
    return { amount, token: deposit.toToken };
  };
};

export const useSwapToSmartAccount = () => {
  const { smartAccountAddress, signerAddress } = useSmartAccount();
  const mainChainClient = useMainChainClient();
  const pubClient = usePublicClient();
  const { primaryWallet } = useDynamicContext();
  const switchNetwork = useSwitchNetwork();

  return async (route: Route): Promise<DepositSAResponse> => {
    if (!smartAccountAddress) throw new Error("Smart account not ready!");
    if (!signerAddress) throw new Error("Please connect wallet!");
    if (!pubClient) throw new Error("Please connect wallet!");
    if (!primaryWallet) throw new Error("Please connect wallet!");
    await switchNetwork({
      network: route.fromChainId,
      wallet: primaryWallet,
    });

    const routeExecuted = await executeRoute(route);

    let amount: string;

    if (!routeExecuted.toAmount) {
      if (!mainChainClient) throw new Error("Please connect wallet!");
      const balanceToken = await mainChainClient.readContract({
        address: routeExecuted.toToken.address as Hex,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [smartAccountAddress],
      });
      amount = balanceToken.toString();
    } else {
      amount = routeExecuted.toAmount;
    }

    if (!amount) throw new Error("No token balance");
    return { amount, token: routeExecuted.toToken.address as Hex };
  };
};
