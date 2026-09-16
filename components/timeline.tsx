"use client";

import { useEffect, useState } from "react";
import type { Receipt } from "ledgeroot";

interface ReceiptsResponse {
  receipts: Receipt[];
}

export function Timeline() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/receipts")
      .then((res) => res.json() as Promise<ReceiptsResponse>)
      .then((data) => setReceipts(data.receipts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">一致性时间线 · Timeline</h2>
      {loading ? (
        <p className="mt-3 text-sm text-zinc-500">Loading…</p>
      ) : receipts.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          No receipts yet. Run an agent payment to see it here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {receipts.map((receipt) => (
            <li
              key={receipt.id}
              className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${
                receipt.status === "paid"
                  ? "border-zinc-800 bg-zinc-900"
                  : "border-red-900/50 bg-red-950/30"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{receipt.segments.intent.text}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {receipt.counterparty ?? "-"} · {receipt.amount ?? "-"} USDC ·{" "}
                  {new Date(receipt.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium ${
                  receipt.status === "paid" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {receipt.status === "paid" ? "paid" : receipt.reason ?? "denied"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
