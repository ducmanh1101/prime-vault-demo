import { useParams } from "react-router";

import Stake from "./Stake";
import Receipt from "./Receipt";
import PendingAsset from "./PendingAsset";

import { TOKEN_POOLS } from "../../constants/main";

export default function PoolDetail() {
  const { poolId } = useParams();

  if (!poolId) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Stake Pool</h1>
          <p className="text-slate-400">
            Pool :{" "}
            <span className="text-blue-400 font-mono">
              {TOKEN_POOLS[Number(poolId)].name}
            </span>
          </p>
        </div>
        <Stake poolId={Number(poolId)} />
        <PendingAsset poolId={Number(poolId)} />
        <Receipt poolId={Number(poolId)} />
      </div>
    </div>
  );
}
