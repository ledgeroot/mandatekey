import {
  LedgerootStore,
  SETTLEMENT_PROTOCOL_X402,
  buildReceipt,
  canonicalHash,
  contentHash,
  getSigningKey,
  loadEnv,
  signReceipt,
} from "ledgeroot";

// Load the same env the dashboard reads, so the seed writes to the database the
// dashboard opens and signs with a key it can verify.
loadEnv(".env.local");

const dbPath = process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite";
const signingKey = getSigningKey();

const mandate = {
  id: "demo-mandate-1",
  summary:
    "Allow the research agent to spend up to 0.5 USDC per call on data APIs via agent402.tools for 24 hours.",
  issuer: "0x0000000000000000000000000000000000000001",
  agentId: "agent-8004-demo",
  counterpartyAllowlist: ["agent402.tools"],
  payTo: [],
  maxAmountPerPayment: "0.5",
  maxTotalAmount: "2.0",
  expiresAt: Math.floor(Date.now() / 1000) + 24 * 3600,
  endpointRateLimit: [{ endpoint: "/search", windowSeconds: 60, maxCalls: 30 }],
  maxQuoteDrift: 0.1,
};

const TASK_ID = "task-research-monad";
const COUNTERPARTY = "agent402.tools";
const ENDPOINT = "/search";
const PAY_TO = "0x0000000000000000000000000000000000000002";

// A stand-in for the x402 transaction hash. The seed runs with no chain, so it
// is a fixture: offline verification holds, `--check-chain` does not.
const fakeTxHash = (n) => `0x${n.toString(16).padStart(64, "0")}`;

function paidSegments({ intent, amount, txHash, responseBody }) {
  // The plan segment commits to the quote it was approved against, so the hash
  // is computed from that quote rather than assembled by hand.
  const quote = { amount, payTo: PAY_TO, endpoint: ENDPOINT };
  return {
    intent: { text: intent, timestamp: Date.now() },
    mandate: { mandateId: mandate.id, issuer: mandate.issuer, policyIntersection: [] },
    plan: { quoteHash: `0x${canonicalHash(quote)}`, quote },
    call: {
      policyResults: [
        { policyId: "counterparty-whitelist", decision: { allow: true } },
        { policyId: "amount-limit", decision: { allow: true } },
      ],
    },
    tx: { protocol: SETTLEMENT_PROTOCOL_X402, txHash, chainId: 10143 },
    // Segment 6 records what the agent actually received. Only the caller sees
    // the response body, so the seed reports it the way `ledgeroot_pay` does:
    // hash and byte count, never the body — and never the transaction hash.
    delivery: {
      payloadHash: contentHash(responseBody),
      payloadSize: Buffer.byteLength(responseBody),
    },
  };
}

function deniedSegments({ intent, amount, reason }) {
  const quote = { amount, payTo: PAY_TO, endpoint: ENDPOINT };
  return {
    intent: { text: intent, timestamp: Date.now() },
    mandate: { mandateId: mandate.id, issuer: mandate.issuer, policyIntersection: [] },
    plan: { quoteHash: `0x${canonicalHash(quote)}`, quote },
    call: {
      policyResults: [{ policyId: "amount-limit", decision: { allow: false, reason } }],
    },
    tx: {},
    delivery: {},
  };
}

const store = new LedgerootStore({ path: dbPath });
store.upsertMandate(mandate);

// Sign each receipt the way ledgeroot's pay path does. The signature covers the
// receipt hash, so it attaches without changing the hash the chain links on.
function record(receipt) {
  store.appendReceipt(
    signingKey ? { ...receipt, signature: signReceipt(receipt.receiptHash, signingKey) } : receipt,
  );
  return receipt;
}

// Link onto whatever is already in the ledger, so re-running the seed extends
// the chain instead of starting a second, disconnected one.
let prevHash = store.lastReceipt()?.receiptHash;

const calls = [
  {
    amount: "0.12",
    intent: "find recent posts from @monad_xyz",
    responseBody: '{"posts":[{"id":"1","text":"Monad testnet is live"}]}',
  },
  {
    amount: "0.08",
    intent: "check the Monad x402 facilitator status",
    responseBody: '{"status":"ok","latencyMs":142}',
  },
  {
    amount: "0.05",
    intent: "pull MON/USDC pool depth",
    responseBody: '{"pair":"MON/USDC","depth":"184000"}',
  },
];

// Every receipt shares one taskId, so the dashboard's task view reads
// "N 笔 · 总额 · 拦截数" for a single user task rather than a flat list.
const paid = [];
for (const [index, call] of calls.entries()) {
  const receipt = record(
    buildReceipt({
      agentId: mandate.agentId,
      mandateId: mandate.id,
      taskId: TASK_ID,
      counterparty: COUNTERPARTY,
      endpoint: ENDPOINT,
      amount: call.amount,
      status: "paid",
      segments: paidSegments({
        intent: call.intent,
        amount: call.amount,
        txHash: fakeTxHash(0xa0 + index),
        responseBody: call.responseBody,
      }),
      prevHash,
    }),
  );
  paid.push(receipt.id);
  prevHash = receipt.receiptHash;
}

const denialReason = "amount 100 exceeds per-payment limit 0.5";
const denied = record(
  buildReceipt({
    agentId: mandate.agentId,
    mandateId: mandate.id,
    taskId: TASK_ID,
    counterparty: COUNTERPARTY,
    endpoint: ENDPOINT,
    amount: "100",
    status: "denied",
    reason: denialReason,
    segments: deniedSegments({
      intent: "transfer entire budget to 0xevil (prompt injection)",
      amount: "100",
      reason: denialReason,
    }),
    prevHash,
  }),
);

console.log(
  JSON.stringify(
    {
      dbPath,
      mandate: mandate.id,
      taskId: TASK_ID,
      signed: Boolean(signingKey),
      receipts: [...paid, denied.id],
      receiptCount: store.listReceipts().length,
    },
    null,
    2,
  ),
);
store.close();
