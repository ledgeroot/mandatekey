import { NextResponse } from "next/server";
import { LedgerootStore, epochRoot } from "ledgeroot";

export const dynamic = "force-dynamic";

/**
 * The local half of the anchor picture: the current epoch root and the last
 * anchor recorded against this ledger. The card pairs it with the on-chain
 * `latestRoot`, which the browser reads directly through wagmi.
 */
export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    const receipts = store.listReceipts();
    return NextResponse.json({
      root: epochRoot(receipts),
      receiptCount: receipts.length,
      anchor: store.latestAnchor(),
    });
  } finally {
    store.close();
  }
}
