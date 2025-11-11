import { useCallback, useMemo } from "react";
import { getPublicClient, writeContract } from "@wagmi/core";
import {
  erc20Abi,
  maxUint256,
  zeroAddress,
  isAddress,
  isAddressEqual,
  type Hex,
} from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

import { wagmiConfig } from "../configs/wagmi-viem";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";

export interface Token {
  address: string;
  symbol: string;
  decimals?: number;
  name?: string;
}

export interface TokenBalance extends Token {
  balance: string; // formatted balance
  raw: bigint; // raw balance
}
export const useTokenBalances = (tokens: Token[], chainId?: number) => {
  const { address } = useAccount();

  // Tách native token và ERC20 tokens
  const { nativeTokens, erc20Tokens } = useMemo(() => {
    return {
      nativeTokens: tokens.filter(
        (t) =>
          t.address === zeroAddress ||
          t.address === "0x0000000000000000000000000000000000000000"
      ),
      erc20Tokens: tokens.filter(
        (t) =>
          t.address !== zeroAddress &&
          t.address !== "0x0000000000000000000000000000000000000000"
      ),
    };
  }, [tokens]);

  // Lấy native balance (ETH, MATIC, etc.)
  const { data: nativeBalance } = useBalance({
    address,
    chainId,
  });

  // Lấy ERC20 balances bằng useReadContracts (1 multicall)
  const {
    data: erc20Results,
    isLoading,
    error,
  } = useReadContracts({
    contracts: erc20Tokens.map((token) => ({
      address: token.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address!],
      chainId,
    })),
    query: {
      enabled: !!address && erc20Tokens.length > 0,
    },
  });

  // Combine native + ERC20 balances
  const balances = useMemo(() => {
    const resultArr: TokenBalance[] = [];

    // Add native token balances
    nativeTokens.forEach((token) => {
      resultArr.push({
        ...token,
        decimals: token.decimals || 18,
        balance: nativeBalance?.formatted || "0",
        raw: nativeBalance?.value || 0n,
      });
    });

    // Add ERC20 token balances
    if (erc20Results) {
      erc20Results.forEach((erc20Result, index) => {
        const token = erc20Tokens[index];
        const rawBalance =
          erc20Result.status === "success" && erc20Result.result
            ? (erc20Result.result as bigint)
            : 0n;

        resultArr.push({
          ...token,
          decimals: token.decimals || 18,
          balance: formatUnits(rawBalance, token.decimals || 18),
          raw: rawBalance,
        });
      });
    }

    return resultArr.sort((a, b) => Number(b.balance) - Number(a.balance));
  }, [nativeBalance, erc20Results, nativeTokens, erc20Tokens]);

  return {
    balances,
    isLoading,
    error: error || null,
  };
};
export const useToken = (tokenAddress: Hex, enable: boolean = true) => {
  const { address } = useAccount();

  const enabled = useMemo(
    () =>
      isAddress(tokenAddress) &&
      enable &&
      !isAddressEqual(tokenAddress, zeroAddress),
    [tokenAddress, enable]
  );

  const result = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address || zeroAddress],
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
    query: { enabled },
  });

  return result;
};

export const useAllowance = (tokenAddress?: Hex, spender?: Hex) => {
  const { address } = useAccount();

  const result = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address || zeroAddress, spender || zeroAddress],
    query: { enabled: !!address && !!spender && !!tokenAddress },
  });

  return result;
};

export const useApprove = (address: Hex, spender: Hex) => {
  const account = useAccount();

  const approve = useCallback(async () => {
    const params: any = {
      abi: erc20Abi,
      address,
      functionName: "approve",
      args: [spender, maxUint256],
      account: account.address,
    };
    const publicClient = getPublicClient(wagmiConfig);
    if (!publicClient) throw new Error("Please connect wallet!");
    const gas = await publicClient.estimateContractGas(params);

    const result = await writeContract(wagmiConfig, {
      ...params,
      gas,
    });
    return result;
  }, [account.address, address, spender]);

  return approve;
};
