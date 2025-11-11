import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getEntryPoint, isZeroDevConnector } from "@dynamic-labs/ethereum-aa";
import type { Hex, Address } from "viem";
import { erc20Abi, http, zeroAddress } from "viem";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  createKernelAccount,
  createKernelAccountClient,
  type CreateKernelAccountReturnType,
  type KernelAccountClient,
} from "@zerodev/sdk";
import { KERNEL_V3_3 } from "@zerodev/sdk/constants";
import { useReadContract, useWalletClient } from "wagmi";
import { berachain } from "viem/chains";

import { paymasterClient, publicClient } from "../configs/wagmi-viem";
import configs from "../configs";

const { chain } = configs.mainChain;

export interface Transaction {
  to: Address;
  value: bigint;
  data: Hex;
}

interface UseZeroDevAccountReturn {
  smartAccountAddress: Address | null;
  signerAddress: Address | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
  sendUserOperation: (tx: Transaction[]) => Promise<Hex>;
}

// Account cache để tránh re-create smart account
const accountCache = new Map<Address, CreateKernelAccountReturnType<"0.7">>();

export const useSmartAccount = (): UseZeroDevAccountReturn => {
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();
  const { data: walletClient } = useWalletClient();

  const [smartAccountAddress, setSmartAccountAddress] =
    useState<Address | null>(null);
  const [signerAddress, setSignerAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Track mounted state để tránh memory leak
  const isMounted = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Memoize signer address từ wallet - không gọi RPC thêm
  const memoizedSignerAddress = useMemo(() => {
    return primaryWallet?.address as Address | null;
  }, [primaryWallet?.address]);

  // Tạo smart account và cache kết quả
  const createSmartAccount = useCallback(async () => {
    const signerAddr = memoizedSignerAddress;

    if (!signerAddr) {
      throw new Error("Please connect wallet!");
    }

    // Kiểm tra cache trước
    if (accountCache.has(signerAddr)) {
      console.log("✅ Using cached smart account:", signerAddr);
      return accountCache.get(signerAddr)!;
    }

    if (!walletClient) {
      throw new Error("Wallet client not found");
    }

    try {
      const entryPoint = getEntryPoint("0.7");
      const kernelVersion = KERNEL_V3_3;

      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: walletClient,
        entryPoint,
        kernelVersion,
      });

      const account = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator,
        },
        entryPoint,
        kernelVersion,
      });

      // Cache account
      accountCache.set(
        signerAddr,
        account as CreateKernelAccountReturnType<"0.7">
      );

      console.log("✅ Smart Account created:", account.address);
      console.log("✅ Signer (EOA):", signerAddr);

      return account;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to create smart account");
      console.error("❌ Failed to create smart account:", error);
      throw error;
    }
  }, [memoizedSignerAddress, walletClient]);

  useEffect(() => {
    isMounted.current = true;

    const initializeAccount = async () => {
      if (!isMounted.current) return;

      if (!primaryWallet || !sdkHasLoaded) {
        setIsReady(false);
        setSmartAccountAddress(null);
        setSignerAddress(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const walletAddress = (primaryWallet.address as Address) || null;
        setSignerAddress(walletAddress);

        // Case 1: ZeroDev connector (social login)
        if (isZeroDevConnector(primaryWallet.connector)) {
          setSmartAccountAddress(walletAddress);
          setIsReady(true);
          console.log("✅ ZeroDev connector detected");
        }
        // Case 2: Standard wallet connector
        else {
          const account = await createSmartAccount();
          if (isMounted.current) {
            setSmartAccountAddress(account.address as Address);
            setIsReady(true);
          }
        }
      } catch (err) {
        if (!isMounted.current) return;

        const error =
          err instanceof Error ? err : new Error("Failed to create account");
        setError(error);
        setIsReady(false);
        console.error("❌ Error:", error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    // Debounce initialization để tránh gọi nhiều lần liên tiếp
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    initTimeoutRef.current = setTimeout(() => {
      initializeAccount();
    }, 100);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [primaryWallet?.address, sdkHasLoaded, createSmartAccount, primaryWallet]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  const sendUserOperation = useCallback(
    async (calls: Transaction[]): Promise<Hex> => {
      if (!primaryWallet || !isReady) {
        throw new Error("Wallet not connected");
      }

      try {
        let smartAccountClient: KernelAccountClient;

        // Case 1: Social login (ZeroDev connector)
        if (isZeroDevConnector(primaryWallet.connector)) {
          smartAccountClient =
            await primaryWallet.connector.getAccountAbstractionProvider();
        }
        // Case 2: Wallet login
        else {
          const account = await createSmartAccount();
          smartAccountClient = createKernelAccountClient({
            account,
            chain: berachain,
            bundlerTransport: http(import.meta.env.VITE_ZERODEV_RPC),
            client: publicClient,
            paymaster: {
              getPaymasterData: (userOperation) => {
                return paymasterClient.sponsorUserOperation({
                  userOperation,
                });
              },
            },
          });
        }

        if (!smartAccountClient || !smartAccountClient.account) {
          throw new Error("Cannot get smart account client");
        }

        const userOpHash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls,
        });

        const txHash = await smartAccountClient.waitForUserOperationReceipt({
          hash: userOpHash,
        });

        console.log("✅ Transaction Hash:", txHash);
        return userOpHash;
      } catch (err: any) {
        console.error("❌ Failed to send user operation:", err);
        throw err;
      }
    },
    [primaryWallet, isReady, createSmartAccount]
  );

  return {
    smartAccountAddress,
    signerAddress,
    isLoading,
    error,
    isReady,
    sendUserOperation,
  };
};

// Hook để đọc balance - memoize smartAccountAddress
export const usePendingAsset = (tokenAddress: Hex) => {
  const { smartAccountAddress } = useSmartAccount();

  // Memoize account parameter để tránh re-render
  const account = useMemo(() => {
    return smartAccountAddress || zeroAddress;
  }, [smartAccountAddress]);

  const result = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account],
    chainId: chain.id,
    query: {
      staleTime: 30000, // Cache 30s để giảm RPC calls
      gcTime: 60000, // Garbage collect sau 1 phút
    },
  });

  return result;
};
