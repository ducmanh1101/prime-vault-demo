import { formatUnits } from "viem";

import { usePendingAsset } from "../../hooks/useSMA";
import { useReceipts, useStakeVieSA } from "../../hooks/useStake";

import { TOKEN_POOLS } from "../../constants/main";

export default function PendingAsset({ poolId }: { poolId: number }) {
  const { address, decimals, name, symbol } = TOKEN_POOLS[poolId];
  const { data: balance } = usePendingAsset(address);
  const stake = useStakeVieSA();
  const receipts = useReceipts();

  if (!balance) return null;
  return (
    <div className="mt-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
      <h3 className="text-lg font-bold text-white mb-4">
        Pending Asset: {name}
      </h3>
      <div className="space-y-4 flex flex-row justify-between items-center">
        <div>
          <p className="text-sm text-slate-400">Balance Asset: </p>
          <p className="text-2xl font-bold text-green-400">
            {formatUnits(balance, decimals)} {symbol}
          </p>
        </div>
        <button
          className="w-fit bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95"
          onClick={() =>
            stake
              .mutateAsync({ amount: balance.toString(), token: address })
              .finally(() => {
                receipts.refetch();
              })
          }
        >
          {stake.isPending ? (
            <div>
              Staking <div className="loading loading-dots" />
            </div>
          ) : (
            "Stake Now"
          )}
        </button>
      </div>
    </div>
  );
}
