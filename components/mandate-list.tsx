"use client";

import { useEffect, useState } from "react";
import type { Mandate } from "ledgeroot";

interface MandatesResponse {
  mandates: Mandate[];
}

export function MandateList() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mandates")
      .then((res) => res.json() as Promise<MandatesResponse>)
      .then((data) => setMandates(data.mandates))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-300">授权清单 · Mandates</h2>
      {loading ? (
        <p className="mt-3 text-sm text-zinc-500">Loading…</p>
      ) : mandates.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No active mandates.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {mandates.map((mandate) => (
            <li key={mandate.id} className="rounded-lg bg-zinc-900 p-3">
              <p className="text-sm">{mandate.summary}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {mandate.agentId ?? "unbound agent"} · {mandate.maxAmountPerPayment} USDC/call ·{" "}
                {mandate.maxTotalAmount} USDC total
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
