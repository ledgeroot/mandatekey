import { defineChain } from "viem";

/** Block explorer used to link an anchor back to its transaction. */
export const EXPLORER_URL = "https://testnet.monadexplorer.com";

/** Monad Testnet (chainId 10143). RPC is overridable at deploy time. */
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: EXPLORER_URL,
    },
  },
  testnet: true,
});
