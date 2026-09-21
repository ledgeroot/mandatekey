// Files shipped inside the evidence bundle. They live here as strings so the
// exported archive is self-describing without the route having to read files
// off disk at request time.

export const VERIFY_SCRIPT = `#!/usr/bin/env node
//
// Offline verification of a Ledgeroot evidence bundle.
//
// Nothing here contacts a network, and nothing here trusts whoever produced
// the bundle: every receipt hash, chain link and signature is recomputed from
// the bytes in this archive. Run it from the directory you unpacked into:
//
//   npm install ledgeroot
//   node verify.mjs
//
// Exit codes: 0 verified, 1 tampered, 2 incomplete, 3 unreadable bundle.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classify,
  epochRoot,
  verifyAnchor,
  verifyMerkleProof,
  verifyReceiptChain,
} from "ledgeroot";

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(readFileSync(join(here, name), "utf8"));
const readIfPresent = (name) => {
  try {
    return read(name);
  } catch {
    return null;
  }
};

try {
  const receipts = read("receipts.json");
  const { keys } = read("jwks.json");
  const anchor = read("anchor.json");
  const proofs = readIfPresent("proofs.json");

  const issues = [...verifyReceiptChain(receipts, keys).issues];
  if (anchor) {
    issues.push(...verifyAnchor(receipts, anchor.root, anchor.receiptCount).issues);
  }

  // Each proof ties one receipt to the anchored root, which is what lets the
  // holder of a single receipt check it without the rest of the ledger. A proof
  // that does not reach the root is a mismatch, not missing data.
  let checkedProofs = 0;
  if (anchor && Array.isArray(proofs)) {
    const byId = new Map(receipts.map((receipt) => [receipt.id, receipt]));
    for (const proof of proofs) {
      const receipt = byId.get(proof.receiptId);
      if (!receipt) {
        issues.push({
          kind: "tampered",
          message: "inclusion proof names a receipt that is not in the bundle: " + proof.receiptId,
        });
        continue;
      }
      checkedProofs += 1;
      if (!verifyMerkleProof(receipt.receiptHash, proof, anchor.root)) {
        issues.push({
          kind: "tampered",
          message:
            "receipt " + receipt.id + ": inclusion proof does not reach the anchored root",
        });
      }
    }
  }

  const status = classify(issues);
  console.log(
    JSON.stringify(
      {
        status,
        receiptCount: receipts.length,
        checkedProofs,
        localRoot: epochRoot(receipts),
        anchoredRoot: anchor ? anchor.root : null,
        anchorCoversReceipts: anchor ? anchor.receiptCount : null,
        issues,
      },
      null,
      2,
    ),
  );

  process.exit({ verified: 0, tampered: 1, incomplete: 2 }[status]);
} catch (error) {
  console.error("bundle could not be read:", error instanceof Error ? error.message : error);
  process.exit(3);
}
`;

export const VERIFY_README = `Ledgeroot evidence bundle
=========================

receipts.json   Every receipt in this ledger, in append order.
anchor.json     The on-chain epoch anchor the ledger commits to, or null.
proofs.json     One Merkle inclusion proof per receipt the anchor covers, each
                checked against anchor.json's root. Empty when nothing is
                anchored yet.
jwks.json       The issuer's public keys, so signatures can be checked without
                contacting the issuer.
verify.mjs      A standalone verifier.

Verify
------
    npm install ledgeroot
    node verify.mjs

Exit codes: 0 verified, 1 tampered, 2 incomplete, 3 unreadable bundle.

What a pass establishes, and what it does not
---------------------------------------------
A pass means every receipt's hash matches its content, each receipt links to
the one before it, each signature was made by a key listed in jwks.json, and —
when the ledger is anchored — the receipts recompute to the anchored root and
every inclusion proof reaches it.

A proof is what lets you check one receipt on its own: given the anchored root
and a single receipt's proof, you can confirm it belongs to that epoch without
the rest of the ledger. The files here carry both so the check is runnable as
delivered.

It does not establish that the key belongs to the party you expect, that a
signed statement is true, or that this ledger is the issuer's whole history.
`;
