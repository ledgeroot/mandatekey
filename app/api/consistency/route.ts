import { NextResponse } from "next/server";
import { LedgerootStore, analyzeConsistency } from "ledgeroot";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    const receipts = store.listReceipts();
    // Every mandate, revoked ones included. Revocation is not retroactive: a
    // payment made while the mandate was in force stays authorized afterwards.
    // Reading the active-only view here makes every receipt under a revoked
    // mandate look like it was made against an unknown mandate, which shows the
    // legitimate payment as an over-authorization violation the moment someone
    // uses the kill switch.
    const mandates = store.listMandateRecords();
    return NextResponse.json({
      items: analyzeConsistency(receipts, mandates),
      mandates,
    });
  } finally {
    store.close();
  }
}
