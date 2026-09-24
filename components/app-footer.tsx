"use client";

import { useT } from "@/lib/i18n";

export function AppFooter() {
  const t = useT();

  return (
    <footer className="border-line text-ink-faint border-t">
      <div className="mx-auto max-w-[1400px] px-4 py-3 text-xs lg:px-6">
        {t("footer.provenance")}
      </div>
    </footer>
  );
}
