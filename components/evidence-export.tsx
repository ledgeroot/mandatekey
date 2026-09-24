"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

export function EvidenceExport() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/export", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ledgeroot-evidence.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface px-4 py-4 lg:px-5">
      <h2 className="label">{t("evidence.section")}</h2>
      <p className="text-ink-muted mt-2 max-w-[58ch] text-xs">{t("evidence.body")}</p>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="border-line-strong text-ink ease-out-quint mt-3 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 hover:bg-sunken disabled:opacity-50"
      >
        {busy ? t("evidence.busy") : t("evidence.action")}
      </button>
      {error ? <p className="text-bad mt-2 text-xs">{t("evidence.failed", { error })}</p> : null}
    </div>
  );
}
