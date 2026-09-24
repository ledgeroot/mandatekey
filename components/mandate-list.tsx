"use client";

import type { MandateRecord } from "ledgeroot";
import { Skeleton } from "@/components/skeleton";
import { dateLocale, useLocale, useT } from "@/lib/i18n";
import { toggleSelectedMandate, useSelectedMandate } from "@/lib/selection-bus";
import { usePoll } from "@/lib/use-poll";

interface MandateRow extends MandateRecord {
  /** Paid total under this mandate, as a decimal string. */
  spent: string;
}

interface MandatesResponse {
  mandates: MandateRow[];
}

export function MandateList() {
  const t = useT();
  const locale = useLocale();
  const { data, loading, error } = usePoll<MandatesResponse>("/api/mandates");
  const mandates = data?.mandates ?? [];
  const selected = useSelectedMandate();

  return (
    <section className="bg-surface p-4 lg:p-5">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="label">{t("mandates.section")}</h2>
        {loading || error ? null : (
          <span className="mono text-ink-faint text-[0.6875rem]">{mandates.length}</span>
        )}
      </header>

      {loading ? (
        <div className="mt-3 space-y-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-2/5" />
              <Skeleton className="h-2.5 w-3/5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-bad mt-3 text-xs">{t("mandates.error", { error })}</p>
      ) : mandates.length === 0 ? (
        <div className="mt-3 text-xs">
          <p className="text-ink-muted">{t("mandates.empty")}</p>
          <p className="text-ink-faint mt-1">{t("mandates.emptyHint")}</p>
        </div>
      ) : (
        <ul className="divide-line mt-2 divide-y">
          {mandates.map((mandate) => {
            const limit = Number(mandate.maxTotalAmount);
            const used = Number(mandate.spent);
            const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
            const expired = mandate.expiresAt * 1000 < Date.now();
            const traced = selected === mandate.id;

            return (
              <li key={mandate.id}>
                <button
                  type="button"
                  onClick={() => toggleSelectedMandate(mandate.id)}
                  title={t("mandates.trace")}
                  aria-pressed={traced}
                  className={`ease-out-quint w-full px-1 py-3 text-left transition-colors duration-150 ${
                    traced ? "traced rounded-sm" : "hover:bg-sunken"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-[0.8125rem] leading-snug [overflow-wrap:anywhere]">
                      {mandate.summary}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {traced ? (
                        <span className="chip border-line bg-accent-soft text-accent">
                          {t("mandates.tracing")}
                        </span>
                      ) : null}
                      {mandate.revoked ? (
                        <span className="chip border-line bg-sunken text-ink-muted">
                          {t("mandates.revoked")}
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <span className="mono text-ink-faint mt-1 block truncate text-[0.6875rem]">
                    {mandate.id}
                  </span>

                  <span className="text-ink-muted mt-1 block text-xs">
                    {t("mandates.perPayment", { amount: mandate.maxAmountPerPayment })}
                    {" · "}
                    {t("mandates.spent", { spent: mandate.spent, total: mandate.maxTotalAmount })}
                  </span>

                  <span className="bg-sunken mt-2 block h-[3px] overflow-hidden rounded-full">
                    <span
                      className={`block h-full rounded-full ${ratio >= 1 ? "bg-bad" : "bg-ok"}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </span>

                  <span
                    className={`mt-1 block text-[0.6875rem] ${expired ? "text-warn" : "text-ink-faint"}`}
                  >
                    {expired ? `${t("mandates.expired")} · ` : ""}
                    {t("mandates.expiresAt", {
                      date: new Date(mandate.expiresAt * 1000).toLocaleString(dateLocale(locale)),
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
