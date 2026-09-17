import { NextResponse } from "next/server";
import { LedgerootStore, analyzeConsistency } from "ledgeroot";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    const receipts = store.listReceipts();
    const mandates = store.listMandates();
    return NextResponse.json({
      items: analyzeConsistency(receipts, mandates),
      mandates,
    });
  } finally {
    store.close();
  }
}
