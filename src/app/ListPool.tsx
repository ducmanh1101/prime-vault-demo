import { Wallet } from "lucide-react";
import { useNavigate } from "react-router";

import { TOKEN_POOLS } from "../constants/main";

export default function ListPool() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Stake Pool</h1>
        <p className="text-slate-400 mb-8">
          Select a token to stake and earn rewards
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.keys(TOKEN_POOLS).map((keys) => {
            const { address, symbol } = TOKEN_POOLS[Number(keys)];
            return (
              <div
                key={address}
                className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    Pool
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">{symbol}</h2>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">APY</span>
                    <span className="text-green-400 font-semibold">12.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TVL</span>
                    <span className="text-slate-200">$2.4M</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/pool/${keys}`)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95"
                >
                  Stake {symbol}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
