"use client";

import { useReadContract } from "wagmi";
import { ANCHOR_ABI, ANCHOR_ADDRESS } from "@/lib/anchor";
import { monadTestnet } from "@/lib/chains";

export function AnchorStatus() {
  const enabled = ANCHOR_ADDRESS.length === 42;
  const { data: latestRoot, isError } = useReadContract({
    address: ANCHOR_ADDRESS,
    abi: ANCHOR_ABI,
    functionName: "latestRoot",
    chainId: monadTestnet.id,
    query: { enabled },
  });

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">链上锚定 · Anchor</h2>
      {!enabled ? (
        <p className="mt-3 text-sm text-zinc-500">
          No anchor contract configured (NEXT_PUBLIC_ANCHOR_ADDRESS).
        </p>
      ) : isError ? (
        <p className="mt-3 text-sm text-zinc-500">Unable to read the anchor contract.</p>
      ) : (
        <p className="mt-3 break-all text-xs text-zinc-400">
          latestRoot: {latestRoot ?? "—"}
        </p>
      )}
    </div>
  );
}
