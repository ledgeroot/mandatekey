import { NextResponse } from "next/server";
import { LedgerootStore, epochRoot, verifyReceiptChain } from "ledgeroot";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    const receipts = store.listReceipts();
    const root = epochRoot(receipts);
    const anchor = store.latestAnchor();
    const verification = verifyReceiptChain(receipts);
    return NextResponse.json({
      bundle: {
        schema: "ledgeroot.evidence.v1",
        exportedAt: new Date().toISOString(),
        root,
        anchor,
        receipts,
        verification,
      },
    });
  } finally {
    store.close();
  }
}
