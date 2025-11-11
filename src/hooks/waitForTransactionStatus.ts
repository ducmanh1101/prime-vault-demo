import { getStatus, type FullStatusData, type StatusResponse } from "@lifi/sdk";
import type { Hex } from "viem";

type GetStatusRequestExtended = {
  txHash: Hex;
  bridge?: string;
  fromAddress?: Hex;
  fromChain?: number;
  toChain?: number;
};

export async function waitForTransactionStatus(
  params: GetStatusRequestExtended
): Promise<FullStatusData> {
  const { txHash, bridge, fromAddress, fromChain, toChain } = params;
  let result: StatusResponse;
  do {
    await new Promise((res) => {
      setTimeout(() => {
        res(null);
      }, 5000);
    });

    result = await getStatus({
      txHash,
      bridge,
      fromAddress,
      fromChain,
      toChain,
    });
  } while (result.status !== "DONE" && result.status !== "FAILED");

  if (result.status === "FAILED") throw new Error("Transaction failed");
  if (!("receiving" in result) || !("amount" in result.receiving))
    throw new Error("Status doesn't contain destination chain information.");

  return result as FullStatusData;
}
