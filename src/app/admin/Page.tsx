import { useCallback, useState } from "react";
import { useWriteContract } from "wagmi";
import { BRIDGE_EXECUTOR_ABI } from "../../constants/abi";
import {
  ALLOWED_CHAINS,
  BRIDGE_EXECUTOR_ADDRESSES,
} from "../../constants/main";
import type { Hex } from "viem";
import { ChevronDown } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4 min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <SetDiamond />
      <ClaimTokens />
    </div>
  );
}

function SetDiamond() {
  const { writeContractAsync } = useWriteContract();
  const [network, setNetwork] = useState<number>();
  const [address, setAddress] = useState<Hex>();

  const onSet = useCallback(async () => {
    if (!network || !address) return;
    await writeContractAsync({
      address: BRIDGE_EXECUTOR_ADDRESSES[network],
      abi: BRIDGE_EXECUTOR_ABI,
      functionName: "setLiFiDiamond",
      args: [address],
    });
  }, [address, network, writeContractAsync]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-bold text-white">Set LifiDiamond</p>
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Chain
        </label>
        <div className="relative">
          <select
            value={network}
            onChange={(e) => setNetwork(Number(e.target.value))}
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
      <div className="mb-6">
        <div className="flex flex-row justify-between">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            New LifiDiamond Address:
          </label>
        </div>
        <div className="relative">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value as Hex)}
            placeholder="Enter amount"
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        onClick={onSet}
        disabled={!network || !address}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95"
      >
        Confirm
      </button>
    </div>
  );
}

function ClaimTokens() {
  const { writeContractAsync } = useWriteContract();
  const [network, setNetwork] = useState<number>();
  const [address, setAddress] = useState<Hex>();

  const onSet = useCallback(async () => {
    if (!network || !address) return;
    await writeContractAsync({
      address: BRIDGE_EXECUTOR_ADDRESSES[network],
      abi: BRIDGE_EXECUTOR_ABI,
      functionName: "emergencyWithdraw",
      args: [address],
    });
  }, [address, network, writeContractAsync]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-bold text-white">Claim Tokens</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Chain
        </label>
        <div className="relative">
          <select
            value={network}
            onChange={(e) => setNetwork(Number(e.target.value))}
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
      <div className="mb-6">
        <div className="flex flex-row justify-between">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Token address:
          </label>
        </div>
        <div className="relative">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value as Hex)}
            placeholder="Enter amount"
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        onClick={onSet}
        disabled={!network || !address}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95"
      >
        Confirm
      </button>
    </div>
  );
}
