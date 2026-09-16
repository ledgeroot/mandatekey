export const ANCHOR_ABI = [
  {
    type: "function",
    name: "latestRoot",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "lastEpoch",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const ANCHOR_ADDRESS = (process.env.NEXT_PUBLIC_ANCHOR_ADDRESS ??
  "") as `0x${string}`;
