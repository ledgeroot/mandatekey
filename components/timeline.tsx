"use client";

import { useEffect, useState } from "react";
import type { ReceiptConsistency } from "ledgeroot";

interface ConsistencyResponse {
  items: ReceiptConsistency[];
}

function badge(violation: boolean, status: "paid" | "denied") {
  if (violation) return "border-red-700/60 bg-red-950/40";
  if (status === "denied") return "border-red-900/50 bg-red-950/30";
  return "border-zinc-800 bg-zinc-900";
}

export function Timeline() {
  const [items, setItems] = useState<ReceiptConsistency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/consistency")
      .then((res) => res.json() as Promise<ConsistencyResponse>)
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">一致性时间线 · Timeline</h2>
      {loading ? (
        <p className="mt-3 text-sm text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          No receipts yet. Run an agent payment to see it here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map(({ receipt, violation, reasons, cumulativeSpent, mandateTotalLimit }) => (
            <li
              key={receipt.id}
              className={`rounded-lg border p-3 ${badge(violation, receipt.status)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">{receipt.segments.intent.text}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {receipt.counterparty ?? "-"} · {receipt.amount ?? "-"} USDC ·{" "}
                    {new Date(receipt.timestamp).toLocaleTimeString()}
                  </p>
                  {cumulativeSpent && mandateTotalLimit ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      累计 {cumulativeSpent} / 上限 {mandateTotalLimit} USDC
                    </p>
                  ) : null}
                  {violation ? (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      越权：{reasons.join("；")}
                    </p>
                  ) : receipt.status === "denied" ? (
                    <p className="mt-1 text-xs text-red-400/80">{receipt.reason}</p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 text-xs font-medium ${
                    violation || receipt.status === "denied"
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {receipt.status === "paid" ? (violation ? "越权" : "paid") : "已拦截"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
