import { NextResponse } from "next/server";
import { LedgerootStore, classify, verifyAnchor, verifyReceiptChain } from "ledgeroot";
import { issuerKeys } from "@/lib/issuer-keys";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    const receipts = store.listReceipts();
    // The anchor covers a prefix of the ledger, not all of it, so it is checked
    // against the boundary it recorded rather than against every receipt.
    const anchor = store.latestAnchor();
    const anchorResult = anchor
      ? verifyAnchor(receipts, anchor.root, anchor.receiptCount)
      : null;
    const chain = verifyReceiptChain(receipts, issuerKeys());
    const issues = [...chain.issues, ...(anchorResult?.issues ?? [])];
    return NextResponse.json({
      status: classify(issues),
      issues,
      receiptCount: receipts.length,
      chain,
      anchor: anchor
        ? {
            epoch: anchor.epoch,
            root: anchor.root,
            txHash: anchor.txHash,
            receiptCount: anchor.receiptCount,
            verification: anchorResult,
          }
        : null,
    });
  } finally {
    store.close();
  }
}
