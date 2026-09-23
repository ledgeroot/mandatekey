import { defineChain } from "viem";

/**
 * Monad mainnet (chainId 143) — the chain the live anchor contract is on.
 *
 * The Anchor panel reads `latestRoot` / `lastEpoch` straight from the browser,
 * so this has to be the same chain the engine anchored to. It mirrors the
 * engine's `monadMainnet` in `ledgeroot/src/chains.ts`.
 */
export const monadMainnet = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://monadexplorer.com",
    },
  },
});

/** Block explorer used to link an anchor back to its transaction. */
export const EXPLORER_URL = "https://monadexplorer.com";
