import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RouterProvider } from "react-router";
import { Buffer } from "buffer";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ZeroDevSmartWalletConnectors } from "@dynamic-labs/ethereum-aa";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { ToastContainer } from "react-toastify";

import LiFiProvider from "./LifiProvider.tsx";

import { wagmiConfig } from "./configs/wagmi-viem.ts";
import { routes } from "./routes/routes-config.tsx";
import { queryClient } from "./configs/query.ts";

import "./index.css";

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DynamicContextProvider
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ID,
        walletConnectors: [
          EthereumWalletConnectors,
          ZeroDevSmartWalletConnectors,
        ],
      }}
    >
      <WagmiProvider config={wagmiConfig} reconnectOnMount>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <LiFiProvider>
              <RouterProvider router={routes} />
              <ToastContainer />
            </LiFiProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  </StrictMode>
);
