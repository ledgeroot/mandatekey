import { NextResponse } from "next/server";
import { LedgerootStore, analyzeConsistency } from "ledgeroot";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    // Every mandate, revoked ones included. After a kill switch the point is to
    // see the authorizations flip to revoked, not to watch them disappear.
    const mandates = store.listMandateRecords();
    const receipts = store.listReceipts();

    // Spend per mandate is the running total the consistency pass already
    // computes; its last entry under a mandate is that mandate's total.
    const spent = new Map<string, string>();
    for (const item of analyzeConsistency(receipts, mandates)) {
      const mandateId = item.receipt.mandateId;
      if (mandateId && item.cumulativeSpent) spent.set(mandateId, item.cumulativeSpent);
    }

    return NextResponse.json({
      mandates: mandates.map((mandate) => ({
        ...mandate,
        spent: spent.get(mandate.id) ?? "0",
      })),
    });
  } finally {
    store.close();
  }
}
