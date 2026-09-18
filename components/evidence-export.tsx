"use client";

import { useState } from "react";

export function EvidenceExport() {
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
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">可验证证据包 · Evidence</h2>
      <p className="mt-3 text-sm text-zinc-500">
        Receipts + anchor record + JWKS + a standalone verifier, as one zip. Unzip it and run{" "}
        <code className="rounded bg-zinc-900 px-1">node verify.mjs</code> — no server, no
        ledgeroot install on our side.
      </p>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        {busy ? "Exporting…" : "导出证据包"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-400">导出失败：{error}</p> : null}
    </div>
  );
}
