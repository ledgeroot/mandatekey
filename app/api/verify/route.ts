import { NextResponse } from "next/server";
import { LedgerootStore, verifyAnchor, verifyReceiptChain } from "ledgeroot";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    const receipts = store.listReceipts();
    const chain = verifyReceiptChain(receipts);
    const anchor = store.latestAnchor();
    const anchorResult = anchor ? verifyAnchor(receipts, anchor.root) : null;
    return NextResponse.json({
      chain,
      anchor: anchor
        ? {
            epoch: anchor.epoch,
            root: anchor.root,
            txHash: anchor.txHash,
            verification: anchorResult,
          }
        : null,
    });
  } finally {
    store.close();
  }
}
