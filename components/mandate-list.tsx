"use client";

import type { MandateRecord } from "ledgeroot";
import { usePoll } from "@/lib/use-poll";

interface MandateRow extends MandateRecord {
  /** Paid total under this mandate, as a decimal string. */
  spent: string;
}

interface MandatesResponse {
  mandates: MandateRow[];
}

export function MandateList() {
  const { data, loading, error } = usePoll<MandatesResponse>("/api/mandates");
  const mandates = data?.mandates ?? [];

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">授权清单 · Mandates</h2>
      {loading ? (
        <p className="mt-3 text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-400">无法读取授权：{error}</p>
      ) : mandates.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          No mandates yet. Run <code className="rounded bg-zinc-900 px-1">npm run seed</code> to
          write the demo authorization.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {mandates.map((mandate) => {
            const limit = Number(mandate.maxTotalAmount);
            const used = Number(mandate.spent);
            const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
            const expired = mandate.expiresAt * 1000 < Date.now();

            return (
              <li
                key={mandate.id}
                className={`rounded-lg p-3 ${mandate.revoked ? "bg-zinc-900/40 opacity-60" : "bg-zinc-900"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm ${mandate.revoked ? "text-zinc-400 line-through" : ""}`}
                  >
                    {mandate.summary}
                  </p>
                  {mandate.revoked ? (
                    <span className="shrink-0 text-xs font-medium text-red-400">已撤销</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {mandate.agentId ?? "unbound agent"} · 单笔上限 {mandate.maxAmountPerPayment} USDC
                </p>
                <p className={`mt-1 text-xs ${expired ? "text-amber-400" : "text-zinc-500"}`}>
                  {expired ? "已过期 · " : ""}
                  有效期至 {new Date(mandate.expiresAt * 1000).toLocaleString()}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full ${ratio >= 1 ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  已用 {mandate.spent} / 累计上限 {mandate.maxTotalAmount} USDC
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
