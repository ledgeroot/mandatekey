"use client";

import { KillSwitch } from "@/components/kill-switch";
import { LanguageToggle } from "@/components/language-toggle";
import { useT } from "@/lib/i18n";

export function AppHeader() {
  const t = useT();

  return (
    <header className="border-line bg-surface sticky top-0 z-10 border-b">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 lg:px-6">
        <div className="min-w-0">
          <h1 className="text-[1.25rem] leading-tight font-semibold tracking-tight">MandateKey</h1>
          <p className="text-ink-muted mt-0.5 max-w-[68ch] text-xs">{t("app.tagline")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <LanguageToggle />
          <KillSwitch />
        </div>
      </div>
    </header>
  );
}
