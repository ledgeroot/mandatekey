<div align="center">

# MandateKey

### The keyring for agent authorizations — who can spend, how much, until when

**The industry built the locks; nobody built the keyring. It built the brakes; nobody built the black box.**

![Next.js](https://img.shields.io/badge/next.js-16-black)
![Storage](https://img.shields.io/badge/storage-local%20SQLite-informational)
![Backend](https://img.shields.io/badge/backend-none-informational)
![Hosting](https://img.shields.io/badge/hosting-local%20only-lightgrey)

**English** · [中文](./README.zh-CN.md)

</div>

---

MandateKey is the **dashboard half** of [Ledgeroot](../ledgeroot): it consumes the evidence stream the engine writes and answers the user's three questions on one screen — **which agents are authorized, how much they may spend, and until when** — then lets the user cut everything off and walk away with the evidence.

> A wallet holds the money. MandateKey holds **who is allowed to move it**, and **how to prove what moved afterwards**.

It reads the local Ledgeroot SQLite database and the anchor contract. **There is no backend and no server**: the browser talks to Next.js route handlers running on your machine, which read SQLite and an RPC endpoint. Nothing leaves the machine.

---

## See it

Five panels, against a ledger that has one real settlement in it:

| Panel | What it shows |
|---|---|
| **Mandates** | every authorization with its per-payment ceiling, cumulative ceiling, expiry and spend so far. A revoked one **stays on screen and reads `已撤销`** — a row that vanishes tells the user less than one that is visibly dead |
| **Timeline** | the receipt stream, with over-authorization flagged red, denials carrying the policy that stopped them, and payments grouped by task (`N payments · total · N blocked`) |
| **Anchor** | the local anchor record next to the chain's `latestRoot` **and** `lastEpoch` — two independent verdicts, because a matching root with a stale epoch is exactly how a record drifts |
| **Verify** | `verified` / `tampered` / `incomplete`, with the issues that produced the verdict |
| **Evidence** | one zip: receipts + anchor record + per-receipt inclusion proofs + JWKS + a verifier you can run |

The ledger views poll every 3 seconds, the anchor card every 5, so receipts appear as the agent spends. Actions are not made to wait for a poll: the kill switch pulls every view forward the moment it lands.

---

## Get started

### 1. Run it offline (no wallet, no network)

```bash
npm install
npm run seed        # writes a demo authorization + receipts through the engine's dry-run rail
npm run dev         # http://localhost:3000
```

### 2. Point it at a ledger that has real payments

```bash
# Same database the engine writes to
LEDGEROOT_DB=/absolute/path/ledgeroot.sqlite npm run dev
```

Anchoring lives on the **write** side, in the engine — the anchor key is never put in this repository:

```bash
cd ../ledgeroot && npm run anchor -- --db ./ledgeroot.sqlite
```

Until that runs, the Anchor panel says the ledger is not anchored. **It does not invent a root.**

> ⚠️ **`npm run seed` appends to whatever `LEDGEROOT_DB` points at; it does not clear the database.** It uses the dry-run payment rail, so those receipts carry synthetic transaction hashes: offline verification holds, `--check-chain` will (correctly) disagree with them. **If you already have real payments in that ledger, do not seed into it** — pass a different path (`LEDGEROOT_DB=/tmp/demo.sqlite npm run seed`).
>
> The seed does not hand-build receipts. It calls the engine's `handlePay`, so policy verdicts, both quote and delivery segments, the signature and the hash chain are all produced the way the engine produces them. Only the settlement is simulated.

---

## Why MandateKey?

- **One screen, not one silo per protocol.** The engine writes authorizations and receipts; this is where a human can actually see them.
- **The write side keeps the keys.** Anchoring and payment signing live in [Ledgeroot](../ledgeroot). This repository holds the **receipt-signing seed** (it needs it to check attribution) and never the key that moves money.
- **Revocation has to be visible.** Pressing the kill switch flips every row to `已撤销` and the next payment is denied and recorded — the user sees the flip, rather than inferring it from an empty list.
- **Evidence you can hand over.** The export is a zip a third party verifies with `node verify.mjs`, without installing anything of ours and without calling us.
- **It does not flatter the data.** Revoked authorizations stay listed. An over-authorized payment is flagged red. A verifier that cannot check something says `incomplete` instead of `verified` — the panel renders the engine's verdict rather than its own opinion.
- **No backend, no telemetry, no account.** Read-only against the ledger, apart from the revocation flag.

---

## Where it sits

| | [Ledgeroot](../ledgeroot) — the engine | MandateKey — the dashboard |
|---|---|---|
| Role | **write side**: authorizations, fail-closed policy, receipts, anchoring | **read side**: authorization list, consistency view, revocation, evidence export |
| Runs | in the agent's MCP host, next to the wallet | in the browser, next to the human |
| Holds | the payment key and the anchor key | the receipt-signing seed, and no money key |

> ⚠️ **Aggregation is partial.** This dashboard reads the engine's `mandates` table. AP2-imported authorizations, the local policy inventory and x402 sessions are **not** yet folded into one view — see [Known limits](#known-limits).

---

## The evidence bundle

One click produces `ledgeroot-evidence.zip`:

| File | Contents |
|---|---|
| `receipts.json` | every receipt, in append order |
| `anchor.json` | the on-chain epoch anchor, or `null` |
| `proofs.json` | one Merkle inclusion proof per receipt the anchor covers, as `{receiptId, index, size, path}` |
| `jwks.json` | the issuer's public keys, so signatures can be checked without calling home |
| `epoch-root.json` | the current root over the whole ledger |
| `verify.mjs` | a standalone verifier |
| `README.txt` | what a pass does and does not establish |

```bash
npm install ledgeroot
node verify.mjs     # exit 0 verified · 1 tampered · 2 incomplete · 3 unreadable
```

A pass means every receipt's hash matches its content, each receipt links to the one before it, each signature was made by a key in `jwks.json`, and — when anchored — the receipts recompute to the anchored root and every inclusion proof reaches it. Tamper with a single proof path and it reports `tampered` naming that receipt, while the chain and anchor checks still pass.

---

## Tri-state verification

The Verify panel renders the engine's verifier verbatim; the definitions belong to it and are worth reading in full in the [engine README](../ledgeroot#tri-state-verification-offline-first).

| Status | Meaning |
|---|---|
| `verified` | every check passed |
| `tampered` | **bytes were checked and do not match** |
| `incomplete` | **evidence is missing or unobtainable** — not the same as tampering, and never a pass |

The panel exists because a verdict nobody can see is not a selling point. It shows the issues that produced the status, not just the colour.

---

## Anchor status

Two verdicts, from two independent contracts reads:

- **Root** — the local anchor record's root against the chain's `latestRoot`.
- **Epoch** — the local anchor's epoch against the chain's `lastEpoch`.

A matching root with a mismatched epoch means the last anchor this ledger recorded is not the last one the contract saw: a stale record, or a second machine anchoring with the same key. That is worth showing precisely because it is the shape of drift that otherwise goes unnoticed.

---

## API routes

| Route | What it does |
|---|---|
| `GET /api/mandates` | every authorization with its revocation state, plus spend so far |
| `POST /api/mandates/revoke` | revoke one (`mandateId`) or all (the kill switch) |
| `GET /api/receipts` | the raw receipt stream |
| `GET /api/consistency` | receipts re-checked against the mandate that authorized them |
| `GET /api/verify` | the engine's tri-state verdict |
| `GET /api/anchor` | current epoch root + the latest anchor record |
| `GET /api/export` | the evidence bundle as a zip |

---

## Environment variables

| Variable | Meaning |
|---|---|
| `LEDGEROOT_DB` | path to the Ledgeroot SQLite database (default `ledgeroot.sqlite`) |
| `LEDGEROOT_SIGNING_KEY` | the receipt-signing seed (32-byte hex). The engine signs with it, this dashboard checks attribution against it, so **both sides must agree**. Unset → receipts verify as `incomplete` |
| `LEDGEROOT_DRY_RUN` | `true` derives a deterministic throwaway key, so the seed and the dashboard line up with no secret to manage (**never for real payments**) |
| `NEXT_PUBLIC_ANCHOR_ADDRESS` | anchor contract address, read by the browser for the Anchor panel |
| `LEDGEROOT_RPC_URL` | Monad testnet RPC (default `https://testnet-rpc.monad.xyz`) |

---

## Known limits

The honest section. These are limits of the **current implementation**, not a repudiation of the design intent.

| Limit | Current state |
|---|---|
| **Aggregation is partial** | Only the engine's `mandates` table is read. AP2-imported authorizations, local policy and x402 sessions are not folded into the same view |
| **No issuance UI** | Authorizations are signed on the write side (`ledgeroot_mandate_sign`). The dashboard can revoke, but it cannot issue — "one sentence and one confirm key" is the target and is **not built here yet** |
| **ERC-8004 is not wired up** | There is no agent card and no reputation view. The engine stores an `agentId` field; nothing validates or displays it |
| **No test suite in this repository** | `npm run typecheck` and `npm run build` only. The engine carries the tests (106 of them) |
| **Runs locally only** | There is no hosted instance, so evaluating it means running it. It also means the browser and the database are expected to be on the same machine |
| **Inclusion proofs cover one epoch** | Proofs are issued for the receipts the latest anchor covers. Receipts appended afterwards wait for the next anchor |
| **It holds the signing seed** | Checking attribution means deriving the issuer's public key, and the engine's API takes a seed to do that. A reader-only deployment should hold only the public half |
| **No license declared in this repository** | The engine it reads is MIT |
| **Read-only, with one exception** | The dashboard writes exactly one thing: the local `revoked` flag behind the kill switch |

---

## Repository layout

```text
app/
  page.tsx            the dashboard
  api/mandates        authorization list + revocation
  api/receipts        the raw receipt stream
  api/consistency     authorization-vs-execution analysis
  api/verify          tri-state verification
  api/export          the evidence bundle (zip)
  api/anchor          epoch root + latest anchor record
components/
  mandate-list        authorizations, spend progress, revoked state
  timeline            receipt stream, task grouping, violation flags
  kill-switch         revoke everything, immediately
  anchor-status       on-chain anchoring + both consistency verdicts (wagmi)
  verification-panel  the tri-state verdict
  evidence-export     the zip download
lib/
  wagmi.ts chains.ts  wallet/chain config + explorer link
  anchor.ts           anchor ABI + address
  use-poll.ts         interval polling for every view
  refresh-bus.ts      makes an action refresh the views at once
  zip.ts              a stored-entry ZIP writer (no dependency)
  verify-bundle.ts    the verifier shipped inside the bundle
  issuer-keys.ts      the public half of the signing key
agent/demo.mjs        the demo seed, driven through the engine
```

---

## Dependency

This repository depends on the **`ledgeroot`** npm package, which is **our own open-source library** (source: [../ledgeroot](../ledgeroot)). It is declared in `package.json`, and its README and history say so. Nothing here is a repackaged third-party engine.

---

## License

**No license is declared in this repository yet.** The engine it reads is [MIT](../ledgeroot/LICENSE).

<div align="center">

### The industry built the locks; nobody built the keyring.

**[Run it and check the evidence yourself.](#get-started)**

📖 **[中文 README](./README.zh-CN.md)** · ⚙️ **[The engine](../ledgeroot)** · 🗺️ **[Roadmap](../ledgeroot/docs/roadmap.md)** · 🛡️ **[Threat landscape](../ledgeroot/docs/threat-landscape.md)**

<sub>no backend · no telemetry · no private key · the evidence verifies without us</sub>

</div>
