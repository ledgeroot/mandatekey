"use client";

import { useEffect } from "react";
import { applyDocumentLang, setLocale, useLocale, useT, type Locale } from "@/lib/i18n";

const OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
];

export function LanguageToggle() {
  const locale = useLocale();
  const t = useT();

  // A stored choice is applied after hydration, so <html lang> has to follow it
  // rather than the markup's initial value.
  useEffect(() => {
    applyDocumentLang(locale);
  }, [locale]);

  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className="border-line inline-flex overflow-hidden rounded-md border"
    >
      {OPTIONS.map((option) => {
        const active = option.value === locale;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            aria-pressed={active}
            className={`ease-out-quint px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide transition-colors duration-150 ${
              active
                ? "bg-ink text-surface"
                : "bg-surface text-ink-muted hover:bg-sunken hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
