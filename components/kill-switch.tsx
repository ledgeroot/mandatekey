"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { requestRefresh } from "@/lib/refresh-bus";

/**
 * The one loud element on the page, deliberately: revoking every authorization
 * is the moment the demo is built around, and it should not look like the rest.
 */
export function KillSwitch() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function kill() {
    if (!window.confirm(t("kill.confirm"))) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/mandates/revoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) {
        setResult(t("kill.failed"));
        return;
      }
      const data = (await res.json()) as { revoked: number };
      setResult(t("kill.done", { count: data.revoked }));
      // Seeing the authorizations flip is the point, so pull the views forward
      // rather than waiting for the next poll.
      requestRefresh();
    } catch {
      setResult(t("kill.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result ? (
        <span className="text-ink-muted max-w-[30ch] text-[0.6875rem] leading-tight">{result}</span>
      ) : null}
      <button
        type="button"
        onClick={kill}
        disabled={busy}
        className="bg-bad text-surface ease-out-quint rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 hover:brightness-110 disabled:opacity-50"
      >
        {busy ? t("kill.busy") : t("kill.action")}
      </button>
    </div>
  );
}
