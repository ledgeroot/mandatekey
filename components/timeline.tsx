"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReceiptConsistency } from "ledgeroot";

interface ConsistencyResponse {
  items: ReceiptConsistency[];
}

function badge(violation: boolean, status: "paid" | "denied") {
  if (violation) return "border-red-700/60 bg-red-950/40";
  if (status === "denied") return "border-red-900/50 bg-red-950/30";
  return "border-zinc-800 bg-zinc-900";
}

interface TaskSummary {
  taskId: string;
  count: number;
  paidTotal: number;
  deniedCount: number;
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

  const tasks = useMemo(() => {
    const map = new Map<string, TaskSummary>();
    for (const { receipt } of items) {
      if (!receipt.taskId) continue;
      const entry = map.get(receipt.taskId) ?? {
        taskId: receipt.taskId,
        count: 0,
        paidTotal: 0,
        deniedCount: 0,
      };
      entry.count += 1;
      if (receipt.status === "paid") entry.paidTotal += Number(receipt.amount ?? 0);
      else entry.deniedCount += 1;
      map.set(receipt.taskId, entry);
    }
    return [...map.values()];
  }, [items]);

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">一致性时间线 · Timeline</h2>

      {tasks.length > 0 ? (
        <div className="mt-3 rounded-lg bg-zinc-900/60 p-3">
          <p className="text-xs font-medium text-zinc-400">按任务聚合 · Tasks</p>
          <ul className="mt-2 space-y-1">
            {tasks.map((task) => (
              <li
                key={task.taskId}
                className="flex items-center justify-between gap-2 text-xs text-zinc-400"
              >
                <span className="truncate">{task.taskId}</span>
                <span className="shrink-0">
                  {task.count} 笔 · {task.paidTotal.toFixed(3)} USDC
                  {task.deniedCount > 0 ? ` · ${task.deniedCount} 拦截` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
                  {receipt.taskId ? (
                    <p className="mt-1 text-xs text-zinc-600">task · {receipt.taskId}</p>
                  ) : null}
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
