"use client";

import { useMemo } from "react";
import type { MandateRecord, ReceiptConsistency } from "ledgeroot";
import { RowSkeletons } from "@/components/skeleton";
import { dateLocale, useLocale, useT } from "@/lib/i18n";
import { toggleSelectedMandate, useSelectedMandate } from "@/lib/selection-bus";
import { usePoll } from "@/lib/use-poll";

interface ConsistencyResponse {
  items: ReceiptConsistency[];
  mandates: MandateRecord[];
}

interface TaskSummary {
  taskId: string;
  count: number;
  paidTotal: number;
  deniedCount: number;
}

const CHIP_PAID = "border-ok-line bg-ok-soft text-ok";
const CHIP_DENIED = "border-bad-line bg-bad-soft text-bad";

export function Timeline() {
  const t = useT();
  const locale = useLocale();
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
    <section className="bg-surface p-4 lg:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="label">{t("timeline.section")}</h2>
        <div className="flex items-center gap-3">
          {selected ? (
            <button
              type="button"
              onClick={() => toggleSelectedMandate(selected)}
              className="text-accent text-[0.6875rem] font-semibold hover:underline"
            >
              {t("timeline.tracing", { id: selected })} · {t("timeline.clear")}
            </button>
          ) : null}
          {loading || error ? null : (
            <span className="mono text-ink-faint text-[0.6875rem]">{items.length}</span>
          )}
        </div>
      </header>

      {tasks.length > 0 ? (
        <div className="divide-line mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b pb-2">
          <span className="label">{t("timeline.byTask")}</span>
          {tasks.map((task) => (
            <span key={task.taskId} className="text-ink-muted text-[0.6875rem]">
              <span className="mono text-ink">{task.taskId}</span>{" "}
              {t("timeline.taskLine", { count: task.count, total: task.paidTotal.toFixed(3) })}
              {task.deniedCount > 0
                ? t("timeline.taskBlocked", { count: task.deniedCount })
                : ""}
            </span>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-3">
          <RowSkeletons rows={3} />
        </div>
      ) : error ? (
        <p className="text-bad mt-3 text-xs">{t("timeline.error", { error })}</p>
      ) : items.length === 0 ? (
        <p className="text-ink-muted mt-3 text-xs">{t("timeline.empty")}</p>
      ) : (
        <ul className="divide-line mt-1 divide-y">
          {items.map(({ receipt, violation, reasons, cumulativeSpent, mandateTotalLimit }) => {
            const mandateId = receipt.mandateId;
            const traced = mandateId !== undefined && mandateId === selected;
            // Nothing is hidden: a receipt outside the traced mandate stays on
            // screen but recedes, so switching mandates never looks like the
            // ledger changed underneath the reader.
            const receded = selected !== null && !traced;
            const blocked = receipt.status === "denied";

            return (
              <li
                key={receipt.id}
                className={`ease-out-quint transition-opacity duration-150 ${
                  receded ? "opacity-40" : ""
                }`}
              >
                <div
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 px-1 py-3 ${
                    traced ? "traced rounded-sm" : "hover:bg-sunken ease-out-quint transition-colors duration-150"
                  }`}
                >
                  <span
                    className={`chip mt-0.5 ${violation || blocked ? CHIP_DENIED : CHIP_PAID}`}
                  >
                    {violation
                      ? t("timeline.status.overAuthorized")
                      : blocked
                        ? t("timeline.status.denied")
                        : t("timeline.status.paid")}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-[0.8125rem] leading-snug">
                      {receipt.segments.intent.text}
                    </p>
                    <p className="text-ink-muted mt-0.5 truncate text-xs">
                      {receipt.counterparty ?? "-"}
                      {receipt.endpoint ? ` ${receipt.endpoint}` : ""}
                      {" · "}
                      {new Date(receipt.timestamp).toLocaleTimeString(dateLocale(locale))}
                    </p>

                    {mandateId ? (
                      <button
                        type="button"
                        onClick={() => toggleSelectedMandate(mandateId)}
                        title={summaryById.get(mandateId) ?? t("mandates.trace")}
                        className={`ease-out-quint mono mt-1 block max-w-full truncate text-left text-[0.6875rem] transition-colors duration-150 hover:underline ${
                          traced ? "text-accent" : "text-ink-faint hover:text-accent"
                        }`}
                      >
                        {t("timeline.mandate")} · {mandateId}
                      </button>
                    ) : null}

                    {receipt.taskId ? (
                      <p className="mono text-ink-faint mt-0.5 truncate text-[0.6875rem]">
                        {t("timeline.task")} · {receipt.taskId}
                      </p>
                    ) : null}

                    {violation ? (
                      <p className="text-bad mt-1 text-xs font-medium">
                        {t("timeline.overAuthorized", { reasons: reasons.join("; ") })}
                      </p>
                    ) : blocked ? (
                      <p className="text-bad mt-1 text-xs">{receipt.reason}</p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p className="mono text-[0.8125rem] leading-snug">
                      {receipt.amount ?? "-"}
                      <span className="text-ink-faint ml-1 text-[0.6875rem]">USDC</span>
                    </p>
                    {cumulativeSpent && mandateTotalLimit ? (
                      <p className="mono text-ink-faint mt-1 text-[0.6875rem]">
                        {t("timeline.cumulative", {
                          spent: cumulativeSpent,
                          limit: mandateTotalLimit,
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
