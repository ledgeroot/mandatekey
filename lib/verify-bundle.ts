// Files shipped inside the evidence bundle. They live here as strings so the
// exported archive is self-describing without the route having to read files
// off disk at request time.

/**
 * The verifier must not need `npm install`. It carries its own RFC 8785
 * canonicaliser and its own RFC 6962 proof walk, and reaches only for
 * `node:crypto`, which is part of Node rather than a package. That is the whole
 * point of shipping it: a recipient can unzip the archive and check the ledger
 * on a machine with nothing of ours on it.
 *
 * Note for whoever edits the script below: it is a template literal, so a
 * backslash is an escape. Do not write escape sequences (not even inside a
 * comment) unless they are doubled, or the emitted file will not parse.
 */
export const VERIFY_SCRIPT = `#!/usr/bin/env node
//
// Offline verification of a Ledgeroot evidence bundle.
//
// Nothing here contacts a network, nothing here trusts whoever produced the
// bundle, and nothing here needs installing: every receipt hash, chain link,
// signature and Merkle proof is recomputed from the bytes in this archive. Run
// it from the directory you unpacked into:
//
//   node verify.mjs
//
// Exit codes: 0 verified, 1 tampered, 2 incomplete, 3 unreadable bundle.

import { readFileSync } from "node:fs";
import { createHash, createPublicKey, verify as ed25519Verify } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(readFileSync(join(here, name), "utf8"));
const readIfPresent = (name) => {
  try {
    return read(name);
  } catch {
    return null;
  }
};

// --- RFC 8785 (JCS) -------------------------------------------------------
// Member names sorted by UTF-16 code unit, no whitespace, and JSON's own string
// escaping, which is already the RFC's table: the six short forms for the
// controls it names, and lowercase hex for the rest. Keys whose value is
// undefined are omitted, which is what JSON.stringify did when the receipt was
// written.

function canonicalize(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  const type = typeof value;
  if (type === "number") {
    if (!Number.isFinite(value)) throw new Error("cannot canonicalize a non-finite number");
    return JSON.stringify(value);
  }
  if (type === "boolean") return value ? "true" : "false";
  if (type === "string") return JSON.stringify(value);
  if (type === "object") {
    const keys = Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort();
    return (
      "{" +
      keys
        .map((key) => JSON.stringify(key) + ":" + canonicalize(value[key]))
        .join(",") +
      "}"
    );
  }
  throw new Error("cannot canonicalize a value of type " + type);
}

const sha256 = (...chunks) => {
  const hash = createHash("sha256");
  for (const chunk of chunks) hash.update(chunk);
  return hash.digest();
};

const canonicalHash = (value) => sha256(Buffer.from(canonicalize(value), "utf8")).toString("hex");

// --- RFC 6962 Merkle ------------------------------------------------------
// Domain separation is what stops a leaf being reinterpreted as a node: a leaf
// is SHA-256 over a 0x00 prefix and the leaf, an internal node is SHA-256 over
// a 0x01 prefix and its two children. The split point is the largest power of
// two below n, so the tree shape follows from the leaf count alone.

const LEAF_PREFIX = Buffer.from([0x00]);
const NODE_PREFIX = Buffer.from([0x01]);

function splitPoint(n) {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
}

function merkleRoot(leaves) {
  const nodes = leaves.map((leaf) => Buffer.from(leaf, "hex"));
  const mth = (lo, hi) => {
    const n = hi - lo;
    if (n === 0) return sha256();
    if (n === 1) return sha256(LEAF_PREFIX, nodes[lo]);
    const k = splitPoint(n);
    return sha256(NODE_PREFIX, mth(lo, lo + k), mth(lo + k, hi));
  };
  return mth(0, nodes.length).toString("hex");
}

/** Fold a leaf and its audit path back into a candidate root. */
function foldPath(leaf, index, size, path, cursor) {
  if (size === 1) return sha256(LEAF_PREFIX, leaf);
  const k = splitPoint(size);
  if (index < k) {
    const left = foldPath(leaf, index, k, path, cursor);
    if (!left || cursor.at >= path.length) return null;
    return sha256(NODE_PREFIX, left, path[cursor.at++]);
  }
  const right = foldPath(leaf, index - k, size - k, path, cursor);
  if (!right || cursor.at >= path.length) return null;
  return sha256(NODE_PREFIX, path[cursor.at++], right);
}

function verifyMerkleProof(leaf, proof, root) {
  if (!Number.isInteger(proof.size) || proof.size <= 0) return false;
  if (!Number.isInteger(proof.index) || proof.index < 0 || proof.index >= proof.size) return false;
  const leafHash = Buffer.from(leaf, "hex");
  if (leafHash.length !== 32) return false;
  const path = proof.path.map((node) => Buffer.from(node, "hex"));
  if (path.some((node) => node.length !== 32)) return false;
  const cursor = { at: 0 };
  const computed = foldPath(leafHash, proof.index, proof.size, path, cursor);
  if (!computed || cursor.at !== path.length) return false;
  return computed.toString("hex") === root;
}

// --- The checks -----------------------------------------------------------

const tampered = (message) => ({ kind: "tampered", message });
const incomplete = (message) => ({ kind: "incomplete", message });

/** A definite mismatch outranks missing evidence. */
function classify(issues) {
  if (issues.some((issue) => issue.kind === "tampered")) return "tampered";
  return issues.length > 0 ? "incomplete" : "verified";
}

/** The receipt hash is over everything except its own id, hash and signature. */
function recomputeReceiptHash(receipt) {
  const content = {};
  for (const key of Object.keys(receipt)) {
    if (key === "id" || key === "receiptHash" || key === "signature") continue;
    content[key] = receipt[key];
  }
  return canonicalHash(content);
}

function verifyReceipt(receipt, keys) {
  const issues = [];

  if (recomputeReceiptHash(receipt) !== receipt.receiptHash) {
    issues.push(tampered("receipt " + receipt.id + ": self hash mismatch"));
  }

  // Segment 3 commits to the quote by hash, so a quote swapped after signing
  // fails here even if the receipt is rehashed to match.
  const plan = receipt.segments.plan;
  if (canonicalHash(plan.quote) !== plan.quoteHash) {
    issues.push(
      tampered("receipt " + receipt.id + ": plan.quoteHash does not commit to the recorded quote"),
    );
  }

  // A paid receipt has to say how it settled. x402 settles one payment with one
  // transaction; a protocol this verifier does not implement may well be
  // complete, and reporting that as anything but missing evidence would claim a
  // check that did not run.
  if (receipt.status === "paid") {
    const tx = receipt.segments.tx;
    if (tx.protocol === undefined || tx.protocol === "x402") {
      if (!tx.txHash) {
        issues.push(incomplete("receipt " + receipt.id + ": paid receipt missing transaction hash"));
      }
    } else {
      issues.push(
        incomplete(
          'receipt ' + receipt.id + ': no settlement check for protocol "' + tx.protocol + '"',
        ),
      );
    }
  }

  const signature = receipt.signature;
  if (!signature) {
    issues.push(incomplete("receipt " + receipt.id + ": unsigned"));
  } else {
    const key = keys.find((candidate) => candidate.kid === signature.protected.kid);
    if (!key) {
      issues.push(
        incomplete("receipt " + receipt.id + ": no public key for kid " + signature.protected.kid),
      );
    } else if (signature.protected.alg !== "EdDSA") {
      // An unknown algorithm is where signature confusion starts.
      issues.push(
        tampered(
          "receipt " + receipt.id + ': unsupported signature algorithm "' +
            signature.protected.alg + '"',
        ),
      );
    } else {
      // The signature covers the canonical bytes of the payload and the
      // protected header together, so alg and kid sit inside the signed input
      // and cannot be swapped after the fact.
      const input = Buffer.from(
        canonicalize({
          payload: { receiptHash: receipt.receiptHash },
          protected: signature.protected,
        }),
        "utf8",
      );
      let publicKey = null;
      try {
        publicKey = createPublicKey({
          key: { kty: "OKP", crv: "Ed25519", x: key.x },
          format: "jwk",
        });
      } catch {
        issues.push(incomplete("receipt " + receipt.id + ": unusable public key for kid " + key.kid));
      }
      if (publicKey) {
        const ok = ed25519Verify(null, input, publicKey, Buffer.from(signature.value, "base64url"));
        if (!ok) issues.push(tampered("receipt " + receipt.id + ": signature does not verify"));
      }
    }
  }

  return issues;
}

function verifyChain(receipts, keys) {
  const issues = [];
  receipts.forEach((receipt, index) => {
    issues.push(...verifyReceipt(receipt, keys));
    if (index === 0) {
      if (receipt.prevHash) {
        issues.push(
          tampered("receipt " + receipt.id + ": first receipt should not have a prevHash"),
        );
      }
    } else if (receipt.prevHash !== receipts[index - 1].receiptHash) {
      issues.push(tampered("receipt " + receipt.id + ": prevHash does not match previous receipt"));
    }
  });
  return issues;
}

/**
 * An epoch covers a prefix: receiptCount is how many receipts existed when the
 * root was anchored. Slicing back to that boundary is why receipts appended
 * after an anchor do not read as tampering.
 */
function verifyAnchor(receipts, anchoredRoot, receiptCount) {
  const issues = receipts.flatMap((receipt) => {
    const self = recomputeReceiptHash(receipt);
    return self === receipt.receiptHash
      ? []
      : [tampered("receipt " + receipt.id + ": self hash mismatch")];
  });

  if (receiptCount === null || receiptCount === undefined) {
    issues.push(incomplete("anchor records no receipt boundary; re-anchor to verify it"));
    return issues;
  }
  if (receipts.length < receiptCount) {
    issues.push(
      tampered(
        "anchored epoch covers " + receiptCount + " receipts but only " + receipts.length +
          " are present",
      ),
    );
    return issues;
  }
  const epoch = receipts.slice(0, receiptCount).map((receipt) => receipt.receiptHash);
  const recomputed = merkleRoot(epoch);
  if (recomputed !== anchoredRoot) {
    issues.push(
      tampered(
        "recomputed epoch root " + recomputed + " does not match anchored root " + anchoredRoot,
      ),
    );
  }
  return issues;
}

// --- Run ------------------------------------------------------------------

try {
  const receipts = read("receipts.json");
  const { keys } = read("jwks.json");
  const anchor = read("anchor.json");
  const proofs = readIfPresent("proofs.json");

  const issues = [...verifyChain(receipts, keys)];
  if (anchor) issues.push(...verifyAnchor(receipts, anchor.root, anchor.receiptCount));

  // Each proof ties one receipt to the anchored root, which is what lets the
  // holder of a single receipt check it without the rest of the ledger. A proof
  // that does not reach the root is a mismatch, not missing data.
  let checkedProofs = 0;
  if (anchor && Array.isArray(proofs)) {
    const byId = new Map(receipts.map((receipt) => [receipt.id, receipt]));
    for (const proof of proofs) {
      const receipt = byId.get(proof.receiptId);
      if (!receipt) {
        issues.push(
          tampered("inclusion proof names a receipt that is not in the bundle: " + proof.receiptId),
        );
        continue;
      }
      checkedProofs += 1;
      if (!verifyMerkleProof(receipt.receiptHash, proof, anchor.root)) {
        issues.push(
          tampered("receipt " + receipt.id + ": inclusion proof does not reach the anchored root"),
        );
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
        localRoot: merkleRoot(receipts.map((receipt) => receipt.receiptHash)),
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
verify.mjs      The verifier.

Verify
------
    node verify.mjs

Exit codes: 0 verified, 1 tampered, 2 incomplete, 3 unreadable bundle.

There is nothing to install. verify.mjs carries its own canonicaliser and its
own Merkle proof walk, and imports only node:crypto. Copy this directory to a
machine with Node and no network and it still runs.

What a pass establishes, and what it does not
---------------------------------------------
A pass means every receipt's hash matches its content, each receipt links to
the one before it, each signature was made by a key listed in jwks.json, and,
when the ledger is anchored, the receipts recompute to the anchored root and
every inclusion proof reaches it.

A proof is what lets you check one receipt on its own: given the anchored root
and a single receipt's proof, you can confirm it belongs to that epoch without
the rest of the ledger. The files here carry both so the check is runnable as
delivered.

It does not establish that the key belongs to the party you expect, that a
signed statement is true, or that this ledger is the issuer's whole history.
`;
