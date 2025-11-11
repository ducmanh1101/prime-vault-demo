export type ICampaign = {
  token: `0x${string}`;
  merkleRoot: `0x${string}`;
  totalAllocated: bigint;
  totalClaimed: bigint;
  feeRate: bigint;
  endTime: bigint;
  name: string;
};
