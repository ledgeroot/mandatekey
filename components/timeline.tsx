"use client";

import { useMemo } from "react";
import type { MandateRecord, ReceiptConsistency } from "ledgeroot";
import { toggleSelectedMandate, useSelectedMandate } from "@/lib/selection-bus";
import { usePoll } from "@/lib/use-poll";

interface ConsistencyResponse {
  items: ReceiptConsistency[];
  mandates: MandateRecord[];
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
  const { data, loading, error } = usePoll<ConsistencyResponse>("/api/consistency");
  const items = useMemo(() => data?.items ?? [], [data]);
  const selected = useSelectedMandate();

  // The id is what a receipt is joined on (and what `revoke` takes); the summary
  // is what a person recognizes. Both arrive with the receipts, so naming the
  // mandate on a row costs no second request.
  const summaryById = useMemo(
    () => new Map((data?.mandates ?? []).map((mandate) => [mandate.id, mandate.summary])),
    [data],
  );

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
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-300">一致性时间线 · Timeline</h2>
        {selected ? (
          <button
            type="button"
            onClick={() => toggleSelectedMandate(selected)}
            className="shrink-0 text-xs font-medium text-emerald-400 hover:underline"
          >
            追踪 {selected} · 清除
          </button>
        ) : null}
      </div>

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
      ) : error ? (
        <p className="mt-3 text-sm text-red-400">无法读取收据：{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          No receipts yet. Run an agent payment to see it here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map(({ receipt, violation, reasons, cumulativeSpent, mandateTotalLimit }) => {
            const mandateId = receipt.mandateId;
            const traced = mandateId !== undefined && mandateId === selected;
            // Nothing is hidden: a receipt outside the traced mandate stays on
            // screen but recedes, so switching mandates never looks like the
            // ledger changed underneath you.
            const receded = selected !== null && !traced;

            return (
              <li
                key={receipt.id}
                className={`rounded-lg border p-3 ${badge(violation, receipt.status)} ${
                  traced ? "ring-1 ring-emerald-500/60" : ""
                } ${receded ? "opacity-40" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{receipt.segments.intent.text}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {receipt.counterparty ?? "-"} · {receipt.amount ?? "-"} USDC ·{" "}
                      {new Date(receipt.timestamp).toLocaleTimeString()}
                    </p>
                    {mandateId ? (
                      <button
                        type="button"
                        title={summaryById.get(mandateId) ?? undefined}
                        onClick={() => toggleSelectedMandate(mandateId)}
                        className={`mt-1 block max-w-full truncate text-left text-xs hover:underline ${
                          traced ? "text-emerald-400" : "text-zinc-500"
                        }`}
                      >
                        mandate · {mandateId}
                      </button>
                    ) : null}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
