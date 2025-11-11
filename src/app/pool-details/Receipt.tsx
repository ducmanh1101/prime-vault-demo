import { Clock, Wallet } from "lucide-react";
import { formatUnits, isAddressEqual, type Hex } from "viem";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getRoutes, type Route } from "@lifi/sdk";

import {
  useClaimReceipt,
  useClaimReceiptCrossChain,
  useReceipts,
} from "../../hooks/useStake";
import { ALLOWED_CHAINS, INTEGRATOR, TOKEN_POOLS } from "../../constants/main";
import { useGetTokensByChain } from "../../hooks/useLiFi";
import configs from "../../configs";
import { useSmartAccount } from "../../hooks/useSMA";

export default function Receipt({ poolId }: { poolId: number }) {
  const { address, decimals, symbol } = TOKEN_POOLS[poolId];
  const receipts = useReceipts();
  const filteredReceipts = receipts.data?.filter((receipt) =>
    isAddressEqual(receipt.token, address)
  );

  return (
    <div className="mt-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-blue-400" />
        Your Staked Tokens
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-500">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                Amount
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                Staked Date
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts?.map((receipt, id) => (
              <tr
                key={id}
                className="border-b border-slate-600 hover:bg-slate-600/30 transition-colors"
              >
                <td className="py-4 px-4 text-white">
                  {formatUnits(receipt.amount, decimals)} {symbol}
                </td>
                <td className="py-4 px-4 text-slate-400">
                  {new Date(Number(receipt.stakedAt) * 1000).toLocaleString()}
                </td>

                <ClaimModal receiptId={BigInt(id)} {...receipt} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredReceipts?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">No staked tokens yet</p>
        </div>
      )}
    </div>
  );
}

function ClaimModal({
  amount,
  token,
  receiptId,
}: {
  amount: bigint;
  token: `0x${string}`;
  receiptId: bigint;
}) {
  const [selectedChain, setSelectedChain] = useState<number>();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [route, setRoute] = useState<Route>();
  const [selectedToken, setSelectedToken] = useState("");
  const { data: tokens } = useGetTokensByChain(Number(selectedChain));
  const claimCross = useClaimReceiptCrossChain();
  const claimReceipt = useClaimReceipt();
  const receipts = useReceipts();
  const [loading, setLoading] = useState(false);
  const { smartAccountAddress, signerAddress } = useSmartAccount();

  const handleGetRoute = useCallback(async () => {
    if (!selectedChain || !selectedToken) throw new Error("Select params");
    if (!smartAccountAddress || !signerAddress)
      throw new Error("No smart account address found!");

    const { routes } = await getRoutes({
      fromAddress: smartAccountAddress,
      fromAmount: amount.toString(),
      fromTokenAddress: token,
      fromChainId: configs.mainChain.chain.id,

      toChainId: selectedChain,
      toTokenAddress: selectedToken,
      toAddress: signerAddress,
      options: {
        integrator: INTEGRATOR,
        order: "FASTEST",
      },
    });

    const route = routes.find((r) => r.steps.length <= 1);
    if (!route) throw new Error("Không có route");
    setRoute(route);
    return route;
  }, [
    amount,
    selectedChain,
    selectedToken,
    signerAddress,
    smartAccountAddress,
    token,
  ]);

  const openModal = () => {
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    modalRef.current?.close();
    setSelectedChain(undefined);
  };

  const isNeedGetRoute = useMemo(() => {
    if (!selectedChain || !selectedToken) return true;
    if (Number(selectedChain) !== configs.mainChain.chain.id) return true;
    if (!isAddressEqual(selectedToken as Hex, token)) return true;
    return false;
  }, [selectedChain, selectedToken, token]);

  const handleClaim = useCallback(async () => {
    try {
      setLoading(true);
      let txHash: Hex;
      if (isNeedGetRoute) {
        const route = await handleGetRoute();
        if (!route) throw new Error("Route not found");

        txHash = await claimCross.mutateAsync({
          lifiStep: route.steps[0],
          receiptId,
        });
      } else {
        setRoute(undefined);
        txHash = await claimReceipt.mutateAsync(receiptId);
      }
      await receipts.refetch();
      console.log("txHash", txHash);
      toast.success("Claim success!");
    } catch (error) {
      console.log(error);
      toast.error(`Claim failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [
    claimCross,
    claimReceipt,
    handleGetRoute,
    isNeedGetRoute,
    receiptId,
    receipts,
  ]);

  return (
    <Fragment>
      <button
        className="mt-4 text-nowrap bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 hover:text-yellow-300 px-3 py-1 rounded transition-colors text-sm font-medium"
        onClick={openModal}
      >
        Claim
      </button>

      <dialog
        ref={modalRef}
        className="modal"
        onClick={(e) => {
          if (e.target === modalRef.current) {
            closeModal();
          }
        }}
      >
        <div className="modal-box bg-gray-800 border border-gray-700">
          <h3 className="font-bold text-lg text-white mb-4">Claim receipt</h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Chain
            </label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-500 transition-colors"
            >
              <option value="" className="bg-gray-700 text-white">
                -- Choose a chain --
              </option>
              {ALLOWED_CHAINS.map((chain) => (
                <option
                  key={chain.id}
                  value={chain.id}
                  className="bg-gray-700 text-white"
                >
                  {chain.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-500 transition-colors"
            >
              <option value={""} className="bg-gray-700 text-white">
                -- Choose a token --
              </option>
              {tokens?.map((token) => (
                <option
                  key={token.address}
                  value={token.address}
                  className="bg-gray-700 text-white"
                >
                  {token.name} - {token.symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Estimate */}
          {route && (
            <div className="mb-6  text-white">
              <p>
                Estimate Claim:{" "}
                {formatUnits(BigInt(route.toAmount), route.toToken.decimals)}{" "}
                {route.toToken.symbol}
              </p>
              <div className="flex flex-row gap-2">
                <Clock />
                <p>{route.steps[0].estimate.executionDuration}s</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleClaim}
              disabled={!selectedChain || !selectedToken || loading}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 disabled:opacity-50 text-gray-900 rounded transition-colors font-medium"
            >
              Claim{loading && "ing"}{" "}
              {loading && <div className="loading loading-dots" />}
            </button>
          </div>
        </div>

        <div
          className="modal-backdrop cursor-pointer bg-black/50"
          onClick={closeModal}
        />
      </dialog>
    </Fragment>
  );
}
