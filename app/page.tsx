import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { MandateList } from "@/components/mandate-list";
import { StatusStrip } from "@/components/status-strip";
import { Timeline } from "@/components/timeline";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <StatusStrip />

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
          {/* Hairline separation via a 1px gap over a line-coloured backing,
              rather than a border on each side. On the narrow breakpoint the
              same gap becomes the rule between the stacked panels. */}
          <div className="bg-line border-line grid gap-px overflow-hidden rounded-lg border lg:grid-cols-[22rem_minmax(0,1fr)]">
            <MandateList />
            <Timeline />
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
