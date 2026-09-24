"use client";

import type { Issue, VerificationStatus } from "ledgeroot";
import { Skeleton } from "@/components/skeleton";
import { useT } from "@/lib/i18n";
import { usePoll } from "@/lib/use-poll";

interface VerifyResponse {
  status: VerificationStatus;
  issues: Issue[];
  receiptCount: number;
  anchor: { epoch: number; root: string; txHash?: string; receiptCount: number | null } | null;
}

const TONE: Record<VerificationStatus, string> = {
  verified: "border-ok-line bg-ok-soft text-ok",
  tampered: "border-bad-line bg-bad-soft text-bad",
  incomplete: "border-warn-line bg-warn-soft text-warn",
};

export function VerificationPanel() {
  const t = useT();
  const { data, loading, error } = usePoll<VerifyResponse>("/api/verify");

  return (
    <div className="bg-surface px-4 py-4 lg:px-5">
      <h2 className="label">{t("verify.section")}</h2>

      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-2.5 w-4/5" />
        </div>
      ) : error ? (
        <p className="text-bad mt-2 text-xs">{error}</p>
      ) : !data ? null : (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* The engine's own status word, never translated: it is the verdict. */}
            <span className={`chip ${TONE[data.status]}`}>{data.status}</span>
            <span className="text-ink-muted text-xs">
              {data.anchor
                ? t("verify.anchored", { count: data.receiptCount, epoch: data.anchor.epoch })
                : t("verify.unanchored", { count: data.receiptCount })}
            </span>
          </div>

          <p className="text-ink-muted max-w-[52ch] text-xs">
            {t(`verify.meaning.${data.status}`)}
          </p>

          {data.issues.length > 0 ? (
            <div>
              <p className="label">{t("verify.issues", { count: data.issues.length })}</p>
              <ul className="mt-1 space-y-0.5">
                {data.issues.slice(0, 5).map((issue, index) => (
                  <li key={index} className="text-warn text-[0.6875rem]">
                    <span className="mono">[{issue.kind}]</span> {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
