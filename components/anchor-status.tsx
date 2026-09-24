"use client";

import { useEffect } from "react";
import { useReadContract } from "wagmi";
import { ANCHOR_ABI, ANCHOR_ADDRESS } from "@/lib/anchor";
import { EXPLORER_URL, monadMainnet } from "@/lib/chains";
import { elide } from "@/lib/format";
import { useT } from "@/lib/i18n";
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

function Verdict({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`flex items-start gap-1.5 text-[0.6875rem] ${ok ? "text-ok" : "text-warn"}`}>
      <span aria-hidden>{ok ? "✓" : "✗"}</span>
      <span>{text}</span>
    </li>
  );
}

export function AnchorStatus() {
  const t = useT();
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
  // last one the contract saw, a stale record, or a second machine anchoring.
  const chainEpochNumber = typeof chainEpoch === "bigint" ? Number(chainEpoch) : null;
  const epochMatches = Boolean(
    anchor && chainEpochNumber !== null && anchor.epoch === chainEpochNumber,
  );
  // The record names the contract it was submitted to. When that is not the one
  // read here, the root and epoch verdicts below compare a ledger's root against
  // a contract that was never meant to hold it, so a disagreement is expected
  // rather than evidence of drift. Absent on records written before the column
  // existed, where the target is simply unknown.
  const contractMatches =
    anchor?.contract === undefined || !configured
      ? null
      : anchor.contract.toLowerCase() === ANCHOR_ADDRESS.toLowerCase();
  const unreadable = rootUnreadable || epochUnreadable;

  return (
    <div className="bg-surface px-4 py-4 lg:px-5">
      <h2 className="label">{t("anchor.section")}</h2>

      {!configured ? (
        <p className="text-ink-muted mt-2 text-xs">{t("anchor.notConfigured")}</p>
      ) : !anchor ? (
        <p className="text-ink-muted mt-2 text-xs">{t("anchor.none")}</p>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="mono text-[0.8125rem]">
              {t("anchor.epoch", { epoch: anchor.epoch })}
            </span>
            <span className="text-ink-muted text-xs">
              {t("anchor.covers", {
                covered: anchor.receiptCount ?? "?",
                total: local?.receiptCount ?? "?",
              })}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="label shrink-0">{t("anchor.root")}</span>
            <span className="mono text-ink-muted truncate text-[0.6875rem]" title={anchor.root}>
              {elide(anchor.root)}
            </span>
          </div>

          {unreadable ? (
            <p className="text-warn text-xs">{t("anchor.unreadable")}</p>
          ) : (
            <ul className="space-y-0.5">
              <Verdict
                ok={rootMatches}
                text={rootMatches ? t("anchor.rootMatch") : t("anchor.rootMismatch")}
              />
              <Verdict
                ok={epochMatches}
                text={
                  epochMatches
                    ? t("anchor.epochMatch")
                    : t("anchor.epochMismatch", {
                        local: anchor.epoch,
                        chain: chainEpochNumber ?? "?",
                      })
                }
              />
              {contractMatches === null ? null : (
                <Verdict
                  ok={contractMatches}
                  text={
                    contractMatches ? t("anchor.contractMatch") : t("anchor.contractMismatch")
                  }
                />
              )}
            </ul>
          )}

          {anchor.txHash ? (
            <a
              className="mono text-accent block truncate text-[0.6875rem] hover:underline"
              href={`${EXPLORER_URL}/tx/${anchor.txHash}`}
              target="_blank"
              rel="noreferrer"
              title={t("anchor.explorer")}
            >
              {elide(anchor.txHash)}
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
