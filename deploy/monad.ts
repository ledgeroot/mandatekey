import { monadTestnet } from "../lib/chains";

/** Monad Metropolis deployment configuration for the dashboard. */
export const monad = {
  name: "monad",
  chain: monadTestnet,
  rpcUrl: process.env.LEDGEROOT_RPC_URL ?? "https://testnet-rpc.monad.xyz",
  anchorContract: (process.env.NEXT_PUBLIC_ANCHOR_ADDRESS ??
    "") as `0x${string}`,
};
