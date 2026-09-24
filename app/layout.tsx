import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MandateKey",
  description:
    "Which agents are authorized, to spend what, until when, and the evidence that they did.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `lang` is corrected on the client when a stored locale is applied.
    <html lang="en">
      <body className="bg-page text-ink font-sans min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
