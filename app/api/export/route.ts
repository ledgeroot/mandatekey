import { NextResponse } from "next/server";
import { LedgerootStore, epochRoot, getSigningKey, jwksOf } from "ledgeroot";
import { VERIFY_README, VERIFY_SCRIPT } from "@/lib/verify-bundle";
import { createZip } from "@/lib/zip";

export const dynamic = "force-dynamic";

/**
 * The evidence bundle: everything a third party needs to check this ledger
 * without installing our software or calling anything of ours. It ships with
 * the verifier, so "take the evidence away and check it yourself" is a command
 * the recipient can actually run.
 */
export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    const receipts = store.listReceipts();
    const anchor = store.latestAnchor();
    const signingKey = getSigningKey();
    const jwks = signingKey ? jwksOf(signingKey) : { keys: [] };

    const zip = createZip([
      { name: "receipts.json", content: JSON.stringify(receipts, null, 2) },
      { name: "anchor.json", content: JSON.stringify(anchor ?? null, null, 2) },
      { name: "jwks.json", content: JSON.stringify(jwks, null, 2) },
      {
        name: "epoch-root.json",
        content: JSON.stringify(
          { root: epochRoot(receipts), receiptCount: receipts.length },
          null,
          2,
        ),
      },
      { name: "verify.mjs", content: VERIFY_SCRIPT },
      { name: "README.txt", content: VERIFY_README },
    ]);

    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="ledgeroot-evidence.zip"',
        "cache-control": "no-store",
      },
    });
  } finally {
    store.close();
  }
}
