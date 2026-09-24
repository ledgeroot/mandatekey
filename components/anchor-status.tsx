"use client";

import { useEffect } from "react";
import { useReadContract } from "wagmi";
import { ANCHOR_ABI, ANCHOR_ADDRESS } from "@/lib/anchor";
import { EXPLORER_URL, monadMainnet } from "@/lib/chains";
import { onRefreshRequest } from "@/lib/refresh-bus";
import { usePoll } from "@/lib/use-poll";

interface AnchorResponse {
  root: string;
  receiptCount: number;
  anchor: {
    epoch: number;
    root: string;
    txHash?: string;
    contract?: string;
    receiptCount: number | null;
  } | null;
}

export function AnchorStatus() {
  const configured = ANCHOR_ADDRESS.length === 42;
  const {
    data: chainRoot,
    isError: rootUnreadable,
    refetch: refetchRoot,
  } = useReadContract({
    address: ANCHOR_ADDRESS,
    abi: ANCHOR_ABI,
    functionName: "latestRoot",
    chainId: monadMainnet.id,
    query: { enabled: configured },
  });
  const {
    data: chainEpoch,
    isError: epochUnreadable,
    refetch: refetchEpoch,
  } = useReadContract({
    address: ANCHOR_ADDRESS,
    abi: ANCHOR_ABI,
    functionName: "lastEpoch",
    chainId: monadMainnet.id,
    query: { enabled: configured },
  });
  const { data: local } = usePoll<AnchorResponse>("/api/anchor", 5000);

  // These chain reads do not go through usePoll, so they need the same nudge.
  useEffect(
    () =>
      onRefreshRequest(() => {
        void refetchRoot();
        void refetchEpoch();
      }),
    [refetchRoot, refetchEpoch],
  );

  const anchor = local?.anchor ?? null;
  // The local root is unprefixed node:crypto hex; the contract returns bytes32.
  const chainRootHex =
    typeof chainRoot === "string" ? chainRoot.replace(/^0x/, "").toLowerCase() : null;
  const rootMatches = Boolean(anchor && chainRootHex && anchor.root.toLowerCase() === chainRootHex);
  // The contract owns the epoch sequence, so its counter and our record should
  // agree. A disagreement means the last anchor this ledger recorded is not the
  // last one the contract saw — a stale record, or a second machine anchoring
  // with the same key.
  const chainEpochNumber = typeof chainEpoch === "bigint" ? Number(chainEpoch) : null;
  const epochMatches = Boolean(
    anchor && chainEpochNumber !== null && anchor.epoch === chainEpochNumber,
  );
  // The record names the contract it was submitted to. When that is not the one
  // this card reads, the root and epoch verdicts below are comparing a ledger's
  // root against a contract that was never meant to hold it — so a mismatch is
  // expected rather than evidence of drift, and it is shown first for that
  // reason. Absent on records written before the column existed, where the
  // target is simply unknown.
  const contractMatches =
    anchor?.contract === undefined || !configured
      ? null
      : anchor.contract.toLowerCase() === ANCHOR_ADDRESS.toLowerCase();
  const unreadable = rootUnreadable || epochUnreadable;

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
          {unreadable ? (
            <p className="font-medium text-amber-400">Could not read the anchor contract</p>
          ) : (
            <>
              {contractMatches === null ? null : (
                <p
                  className={`font-medium ${
                    contractMatches ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {contractMatches
                    ? "✓ Record was anchored to this contract"
                    : "⚠ Record was anchored to a different contract"}
                </p>
              )}
              <p className={`font-medium ${rootMatches ? "text-emerald-400" : "text-amber-400"}`}>
                {rootMatches
                  ? "✓ Root matches the on-chain latestRoot"
                  : "⚠ Root does not match the on-chain latestRoot"}
              </p>
              <p className={`font-medium ${epochMatches ? "text-emerald-400" : "text-amber-400"}`}>
                {epochMatches
                  ? "✓ Epoch matches the on-chain counter"
                  : `⚠ Epoch differs from the on-chain counter (local ${anchor.epoch}, chain ${
                      chainEpochNumber ?? "?"
                    })`}
              </p>
            </>
          )}
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
