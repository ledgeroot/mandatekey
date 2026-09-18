"use client";

import type { Issue, VerificationStatus } from "ledgeroot";
import { usePoll } from "@/lib/use-poll";

interface VerifyResponse {
  status: VerificationStatus;
  issues: Issue[];
  receiptCount: number;
  anchor: { epoch: number; root: string; txHash?: string; receiptCount: number | null } | null;
}

const TONE: Record<VerificationStatus, string> = {
  verified: "border-emerald-800/60 bg-emerald-950/30 text-emerald-400",
  tampered: "border-red-800/60 bg-red-950/30 text-red-400",
  incomplete: "border-amber-800/60 bg-amber-950/30 text-amber-400",
};

const MEANING: Record<VerificationStatus, string> = {
  verified: "Every receipt recomputes to its hash and every signature checks out.",
  tampered: "Bytes were checked and do not match — something was changed.",
  incomplete: "Evidence is missing, so a check could not run. Not the same as tampered.",
};

export function VerificationPanel() {
  const { data, loading, error } = usePoll<VerifyResponse>("/api/verify");

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">离线三态验证 · Verify</h2>
      {loading ? (
        <p className="mt-3 text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-400">无法验证：{error}</p>
      ) : !data ? null : (
        <>
          <div
            className={`mt-3 inline-flex items-center rounded-lg border px-3 py-1 text-sm font-semibold ${TONE[data.status]}`}
          >
            {data.status}
          </div>
          <p className="mt-2 text-xs text-zinc-500">{MEANING[data.status]}</p>
          <p className="mt-2 text-xs text-zinc-400">
            {data.receiptCount} 张收据 ·{" "}
            {data.anchor ? `锚定 epoch ${data.anchor.epoch}` : "尚未锚定"}
          </p>
          {data.issues.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {data.issues.slice(0, 5).map((issue, index) => (
                <li key={index} className="text-xs text-amber-400">
                  [{issue.kind}] {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
