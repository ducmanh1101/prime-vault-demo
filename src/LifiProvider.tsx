import { ChainId, createConfig, EVM } from "@lifi/sdk";
import React, { useEffect } from "react";
import { useWalletClient } from "wagmi";

const LifiProvider = ({ children }: { children: React.ReactNode }) => {
  const client = useWalletClient();

  useEffect(() => {
    if (client.data?.account) {
      createConfig({
        integrator: "JIKO",
        rpcUrls: {
          [ChainId.LNA]: ["https://rpc.linea.build/"],
          [ChainId.BER]: ["https://rpc.berachain.com/"],
        },
        providers: [
          EVM({
            getWalletClient: async () => client.data as any,
          }),
        ],
      });
    }
  }, [client]);

  return children;
};

export default LifiProvider;
