"use client";

import { useEffect } from "react";
import { useReadContract } from "wagmi";
import { ANCHOR_ABI, ANCHOR_ADDRESS } from "@/lib/anchor";
import { EXPLORER_URL, monadTestnet } from "@/lib/chains";
import { onRefreshRequest } from "@/lib/refresh-bus";
import { usePoll } from "@/lib/use-poll";

interface AnchorResponse {
  root: string;
  receiptCount: number;
  anchor: {
    epoch: number;
    root: string;
    txHash?: string;
    receiptCount: number | null;
  } | null;
}

export function AnchorStatus() {
  const configured = ANCHOR_ADDRESS.length === 42;
  const {
    data: chainRoot,
    isError,
    refetch,
  } = useReadContract({
    address: ANCHOR_ADDRESS,
    abi: ANCHOR_ABI,
    functionName: "latestRoot",
    chainId: monadTestnet.id,
    query: { enabled: configured },
  });
  const { data: local } = usePoll<AnchorResponse>("/api/anchor", 5000);

  // This card's chain read does not go through usePoll, so it needs the same nudge.
  useEffect(() => onRefreshRequest(() => void refetch()), [refetch]);

  const anchor = local?.anchor ?? null;
  // The local root is unprefixed node:crypto hex; the contract returns bytes32.
  const chainRootHex =
    typeof chainRoot === "string" ? chainRoot.replace(/^0x/, "").toLowerCase() : null;
  const matches = Boolean(anchor && chainRootHex && anchor.root.toLowerCase() === chainRootHex);

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">链上锚定 · Anchor</h2>
      {!configured ? (
        <p className="mt-3 text-sm text-zinc-500">
          No anchor contract configured (NEXT_PUBLIC_ANCHOR_ADDRESS).
        </p>
      ) : !anchor ? (
        <p className="mt-3 text-sm text-zinc-500">
          This ledger is not anchored yet. Run{" "}
          <code className="rounded bg-zinc-900 px-1">npm run anchor</code> in the ledgeroot repo
          and this card lights up.
        </p>
      ) : (
        <div className="mt-3 space-y-1.5 text-xs">
          <p className="text-zinc-400">
            epoch {anchor.epoch} · covers {anchor.receiptCount ?? "?"} of{" "}
            {local?.receiptCount ?? "?"} receipts
          </p>
          <p className="break-all text-zinc-500">root {anchor.root}</p>
          <p
            className={`font-medium ${
              isError ? "text-amber-400" : matches ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {isError
              ? "Could not read the anchor contract"
              : matches
                ? "✓ Matches the on-chain latestRoot"
                : "⚠ Does not match the on-chain latestRoot"}
          </p>
          {anchor.txHash ? (
            <a
              className="block break-all text-sky-400 hover:underline"
              href={`${EXPLORER_URL}/tx/${anchor.txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              {anchor.txHash}
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
