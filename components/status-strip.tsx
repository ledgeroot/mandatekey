"use client";

import { AnchorStatus } from "@/components/anchor-status";
import { EvidenceExport } from "@/components/evidence-export";
import { VerificationPanel } from "@/components/verification-panel";

/**
 * One band of hairline-divided cells instead of three separate cards: these are
 * three readings of the same ledger, and boxing each one separately would imply
 * they are independent objects.
 */
export function StatusStrip() {
  return (
    <section className="border-line bg-surface border-b">
      <div className="divide-line mx-auto grid max-w-[1400px] divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
        <AnchorStatus />
        <VerificationPanel />
        <EvidenceExport />
      </div>
    </section>
  );
}
