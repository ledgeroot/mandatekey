"use client";

import { useState } from "react";

export function EvidenceExport() {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch("/api/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ledgeroot-evidence.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">可验证证据包 · Evidence</h2>
      <p className="mt-3 text-sm text-zinc-500">
        Receipts + Merkle root + anchor reference. Verify offline with{" "}
        <code className="rounded bg-zinc-900 px-1">npx ledgeroot verify</code>.
      </p>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        {busy ? "Exporting…" : "导出证据包"}
      </button>
    </div>
  );
}
