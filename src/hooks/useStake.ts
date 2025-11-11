import { useReadContract } from "wagmi";
import { getStepTransaction, type LiFiStep } from "@lifi/sdk";
import { useSmartAccount, type Transaction } from "./useSMA";
import { useMainChainClient } from "./useClient";
import {
  encodeFunctionData,
  erc20Abi,
  hexToBigInt,
  maxUint256,
  zeroAddress,
  type Hex,
} from "viem";
import { STAKING_ABI } from "../constants/abi";
import { STAKING_ADDRESS } from "../constants/main";
import configs from "../configs";
import { useMutation } from "@tanstack/react-query";
import type { StakeSAParams } from "./deposit.SA";

const { chain } = configs.mainChain;

export const useStakeVieSA = () => {
  const { smartAccountAddress, sendUserOperation } = useSmartAccount();
  const publicClient = useMainChainClient();
  const { refetch } = useReceipts();
  return useMutation({
    mutationFn: async ({ amount, token }: StakeSAParams) => {
      if (!publicClient) throw new Error("Please connect wallet!");
      if (!smartAccountAddress) throw new Error("Smart account chưa sẵn sàng");
      const calls: Transaction[] = [];

      const allowance = await publicClient.readContract({
        abi: erc20Abi,
        address: token,
        functionName: "allowance",
        args: [smartAccountAddress, STAKING_ADDRESS],
      });

      if (allowance < BigInt(amount)) {
        calls.push({
          to: token,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [STAKING_ADDRESS, maxUint256],
          }),
        });
      }

      calls.push({
        to: STAKING_ADDRESS,
        value: 0n,
        data: encodeFunctionData({
          abi: STAKING_ABI,
          functionName: "stake",
          args: [token, BigInt(amount)],
        }),
      });

      return await sendUserOperation(calls);
    },
    onSuccess: async () => {
      await refetch();
    },
  });
};

export const useReceipts = () => {
  const { smartAccountAddress } = useSmartAccount();

  return useReadContract({
    abi: STAKING_ABI,
    address: STAKING_ADDRESS,
    functionName: "getStakes",
    args: [smartAccountAddress || zeroAddress],
    chainId: chain.id,
    query: {
      enabled: !!smartAccountAddress,
    },
  });
};

export const useClaimReceipt = () => {
  const { signerAddress, smartAccountAddress, sendUserOperation } =
    useSmartAccount();
  const pubMain = useMainChainClient();

  return useMutation({
    mutationFn: async (receiptId: bigint) => {
      if (!smartAccountAddress) throw new Error("Smart account not ready!");
      if (!signerAddress) throw new Error("Please connect wallet!");
      if (!pubMain) throw new Error("Please connect wallet!");

      const receipts = await pubMain.readContract({
        abi: STAKING_ABI,
        address: STAKING_ADDRESS,
        functionName: "getStakes",
        args: [smartAccountAddress],
      });

      const receipt = receipts[Number(receiptId)];

      const calls: Transaction[] = [
        {
          to: STAKING_ADDRESS,
          value: 0n,
          data: encodeFunctionData({
            abi: STAKING_ABI,
            functionName: "withdraw",
            args: [receiptId],
          }),
        },
        {
          to: receipt.token,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [signerAddress, receipt.amount],
          }),
        },
      ];
      return await sendUserOperation(calls);
    },
  });
};

export const useClaimReceiptCrossChain = () => {
  const { smartAccountAddress, sendUserOperation, signerAddress } =
    useSmartAccount();
  const pubMain = useMainChainClient();

  return useMutation({
    mutationFn: async ({
      lifiStep,
      receiptId,
    }: {
      receiptId: bigint;
      lifiStep: LiFiStep;
    }) => {
      if (!signerAddress) throw new Error("Please connect wallet!");
      if (!smartAccountAddress) throw new Error("Smart account not ready!");
      if (!pubMain) throw new Error("Please connect wallet!");
      const { transactionRequest } = await getStepTransaction(lifiStep);

      if (
        !!transactionRequest?.value &&
        hexToBigInt(transactionRequest.value as Hex) > 0n
      )
        throw new Error("Not supported this route, try another!");
      if (!transactionRequest?.to || !transactionRequest?.data)
        throw new Error("Bridge data not found!");

      const calls: Transaction[] = [];

      const allowance = await pubMain.readContract({
        abi: erc20Abi,
        address: lifiStep.action.fromToken.address as Hex,
        functionName: "allowance",
        args: [smartAccountAddress, transactionRequest.to as Hex],
      });

      if (!allowance || allowance < BigInt(lifiStep.action.fromAmount)) {
        calls.push({
          to: lifiStep.action.fromToken.address as Hex,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [transactionRequest.to as Hex, maxUint256],
          }),
        });
      }

      calls.push(
        {
          to: STAKING_ADDRESS,
          value: 0n,
          data: encodeFunctionData({
            abi: STAKING_ABI,
            functionName: "withdraw",
            args: [receiptId],
          }),
        },
        {
          to: transactionRequest.to as Hex,
          value: 0n,
          data: transactionRequest.data as Hex,
        }
      );

      return await sendUserOperation(calls);
    },
  });
};
