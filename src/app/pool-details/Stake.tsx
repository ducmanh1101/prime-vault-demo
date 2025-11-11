import { ChevronDown, Clock, TrendingUp } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useGetRoute, useGetTokensByChain } from "../../hooks/useLiFi";
import { useTokenBalances } from "../../hooks/useERC20";
import { toast } from "react-toastify";

import { getStepTransaction, type Route } from "@lifi/sdk";
import {
  formatUnits,
  hexToBigInt,
  isAddressEqual,
  parseUnits,
  type Hex,
} from "viem";
import { useStakeVieSA } from "../../hooks/useStake";
import { ALLOWED_CHAINS, TOKEN_POOLS } from "../../constants/main";
import {
  useBridgeToSmartAccount,
  useDepositToSmartAccount,
  useSwapToSmartAccount,
} from "../../hooks/useDepositToSmartAccount";
import configs from "../../configs";
import type { DepositCrossSA, DepositSAResponse } from "../../hooks/deposit.SA";

const { chain } = configs.mainChain;

export default function Stake({ poolId }: { poolId: number }) {
  const { address } = TOKEN_POOLS[poolId];
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedChain, setSelectedChain] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [route, setRoute] = useState<Route>();
  const { data: tokens } = useGetTokensByChain(Number(selectedChain));
  const { balances } = useTokenBalances(tokens, Number(selectedChain));
  const stakeViaSA = useStakeVieSA();
  const getRoute = useGetRoute();
  const [loading, setLoading] = useState(false);

  const bridgeToSmartAccount = useBridgeToSmartAccount();
  const depositToSmartAccount = useDepositToSmartAccount();
  const swapToSmartAccount = useSwapToSmartAccount();

  const handleGetRoute = useCallback(async () => {
    const token = tokens?.find((t) => t.address === selectedToken);
    const amountRaw = parseUnits(stakeAmount, token?.decimals || 18);
    const route = await getRoute({
      amount: amountRaw.toString(),
      fromToken: selectedToken,
      fromChainId: Number(selectedChain),
      toToken: address,
    });
    setRoute(route);
    return route;
  }, [address, getRoute, selectedChain, selectedToken, stakeAmount, tokens]);

  const isNeedGetRoute = useMemo(() => {
    if (!selectedChain || !selectedToken) return true;
    if (Number(selectedChain) !== chain.id) return true;
    if (!isAddressEqual(selectedToken as Hex, address)) return true;
    return false;
  }, [address, selectedChain, selectedToken]);

  const handleStake = useCallback(async () => {
    try {
      if (!selectedChain || !selectedToken)
        throw new Error("Please select a chain");
      setLoading(true);
      let dataStake: DepositSAResponse;
      if (isNeedGetRoute) {
        const route = await handleGetRoute();
        if (!route) throw new Error("Route not found");

        if (Number(selectedChain) === chain.id) {
          dataStake = await swapToSmartAccount(route);
        } else {
          const { transactionRequest, tool } = await getStepTransaction(
            route.steps[0]
          );
          if (!transactionRequest?.to || !transactionRequest?.data)
            throw new Error("Route not found!");

          const params: DepositCrossSA = {
            fromChainId: Number(selectedChain),
            fromToken: selectedToken as Hex,
            toChainId: chain.id,
            toToken: address,
            tool,
            data: transactionRequest.data as Hex,
            fromAmount: route.fromAmount,
            value: hexToBigInt(transactionRequest.value as Hex),
          };
          dataStake = await bridgeToSmartAccount(params);
        }
      } else {
        setRoute(undefined);
        dataStake = await depositToSmartAccount({
          fromChainId: Number(selectedChain),
          toToken: address,
          amount: parseUnits(
            stakeAmount,
            TOKEN_POOLS[poolId].decimals
          ).toString(),
        });
      }
      await stakeViaSA.mutateAsync(dataStake);
      setSelectedChain("");
      setSelectedToken("");
      setStakeAmount("");
      return toast.success("Stake successfully");
    } catch (error: any) {
      console.log("error", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [
    address,
    bridgeToSmartAccount,
    depositToSmartAccount,
    handleGetRoute,
    isNeedGetRoute,
    poolId,
    selectedChain,
    selectedToken,
    stakeAmount,
    stakeViaSA,
    swapToSmartAccount,
  ]);

  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Stake Token
        </h2>

        {/* Chain Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Chain
          </label>
          <div className="relative">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="">Choose a chain...</option>
              {ALLOWED_CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Token Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Token
          </label>
          <div className="relative">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="">Choose a token...</option>
              {balances
                ?.filter((t) => Number(t.balance) > 0)
                ?.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name} (Balance: {token.balance})
                  </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Stake Amount Input */}
        <div className="mb-6">
          <div className="flex flex-row justify-between">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount to Stake
            </label>
            {!!selectedToken && (
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Balance:{" "}
                {balances?.find((t) => t.address === selectedToken)?.balance}{" "}
                {balances?.find((t) => t.address === selectedToken)?.symbol}
              </label>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Estimate */}
        {route && (
          <div className="mb-6  text-white">
            <p>
              Estimate Stake:{" "}
              {formatUnits(BigInt(route.toAmount), route.toToken.decimals)}
            </p>
            <div className="flex flex-row gap-2">
              <Clock />
              <p>{route.steps[0].estimate.executionDuration}s</p>
            </div>
          </div>
        )}

        {/* Stake Button */}
        <button
          onClick={handleStake}
          disabled={!selectedChain || !selectedToken || !stakeAmount || loading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95"
        >
          Stake {loading && <div className="loading loading-dots" />}
        </button>
      </div>
    </div>
  );
}
