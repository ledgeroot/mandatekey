import { NextResponse } from "next/server";
import {
  LedgerootStore,
  epochRoot,
  getSigningKey,
  jwksOf,
  merkleProof,
  type MerkleProof,
  type Receipt,
} from "ledgeroot";
import { VERIFY_README, VERIFY_SCRIPT } from "@/lib/verify-bundle";
import { createZip } from "@/lib/zip";

export const dynamic = "force-dynamic";

/**
 * Inclusion proofs for the anchored epoch.
 *
 * An anchor covers a prefix of the ledger. For each receipt in that prefix,
 * prove it belongs to the anchored root, so a holder of one receipt can check
 * it against the anchored root without being handed the rest of the ledger.
 * Without an anchor there is no root to prove against, so the proof list is
 * empty rather than invented.
 */
function proofsFor(
  anchor: { root: string; receiptCount: number | null } | null,
  receipts: Receipt[],
): Record<string, MerkleProof> {
  if (!anchor || anchor.receiptCount === null) return {};
  const epoch = receipts.slice(0, anchor.receiptCount);
  const hashes = epoch.map((receipt) => receipt.receiptHash);
  return Object.fromEntries(
    epoch.map((receipt, index) => [receipt.id, merkleProof(hashes, index)]),
  );
}

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
      {
        name: "proofs.json",
        content: JSON.stringify(
          {
            root: anchor?.root ?? null,
            size: anchor?.receiptCount ?? 0,
            proofs: proofsFor(anchor, receipts),
          },
          null,
          2,
        ),
      },
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
