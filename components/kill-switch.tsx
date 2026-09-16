"use client";

import { useState } from "react";

export function KillSwitch() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function kill() {
    if (!window.confirm("Revoke ALL agent authorizations?")) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/mandates/revoke", { method: "POST" });
      const data = (await res.json()) as { revoked: number };
      setResult(`Revoked ${data.revoked} mandate(s). The next payment will be denied.`);
    } catch {
      setResult("Kill switch failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={kill}
        disabled={busy}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
      >
        {busy ? "Revoking…" : "一键熔断 · Kill switch"}
      </button>
      {result ? <p className="text-xs text-zinc-400">{result}</p> : null}
    </div>
  );
}
