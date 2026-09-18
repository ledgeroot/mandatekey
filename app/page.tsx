import { AnchorStatus } from "@/components/anchor-status";
import { EvidenceExport } from "@/components/evidence-export";
import { KillSwitch } from "@/components/kill-switch";
import { MandateList } from "@/components/mandate-list";
import { Timeline } from "@/components/timeline";
import { VerificationPanel } from "@/components/verification-panel";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">MandateKey</h1>
          <p className="mt-1 text-sm text-zinc-400">
            One place to see what your agents are authorized to do — and prove what they did.
          </p>
        </div>
        <KillSwitch />
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-1">
          <MandateList />
        </section>
        <section className="lg:col-span-2">
          <Timeline />
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <AnchorStatus />
        <VerificationPanel />
        <EvidenceExport />
      </div>
    </main>
  );
}
