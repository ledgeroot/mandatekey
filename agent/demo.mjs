import {
  DryRunPaymentProvider,
  LedgerootStore,
  MONAD_TESTNET_X402,
  PolicyEngine,
  defaultPolicies,
  handlePay,
  loadEnv,
} from "ledgeroot";

// Load the same env the dashboard reads, so the seed writes to the database the
// dashboard opens and signs with a key it can verify.
loadEnv(".env.local");

const dbPath = process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite";

const TASK_ID = "task-research-monad";
const COUNTERPARTY = "agent402.tools";
const PAY_TO = "0x35DA8C7a8d2253354925354b436A0422B9618dE4";
const EVIL = "0x000000000000000000000000000000000000dead";

const mandate = {
  id: "demo-mandate-1",
  summary:
    "Allow the research agent to spend up to 0.5 USDC per call on data APIs via agent402.tools for 24 hours.",
  issuer: "0x0000000000000000000000000000000000000001",
  agentId: "agent-8004-demo",
  counterpartyAllowlist: [COUNTERPARTY],
  // Bound, so the injected quote below is refused for pointing somewhere the
  // mandate never named — which is the reason scenario 2 tells the audience.
  payTo: [PAY_TO],
  maxAmountPerPayment: "0.5",
  maxTotalAmount: "2.0",
  expiresAt: Math.floor(Date.now() / 1000) + 24 * 3600,
  endpointRateLimit: [{ endpoint: "/search", windowSeconds: 60, maxCalls: 30 }],
  maxQuoteDrift: 0.1,
};

/** Payment requirements in the shape a seller sends them. */
function requirements(payTo, amount, resource = "/search") {
  return {
    scheme: MONAD_TESTNET_X402.scheme,
    network: MONAD_TESTNET_X402.network,
    asset: MONAD_TESTNET_X402.usdcAddress,
    payTo,
    amount,
    resource,
  };
}

const store = new LedgerootStore({ path: dbPath });
store.upsertMandate(mandate);

const engine = new PolicyEngine();
for (const policy of defaultPolicies()) engine.register(policy);

// The seed drives the real payment path with the dry-run rail, so what it writes
// is what the engine would write: real policy verdicts, real segments, real
// signatures, a real hash chain. Only the settlement is simulated — the receipts
// carry that provider's synthetic transaction hashes, which is why offline
// verification holds for them but `--check-chain` does not.
const services = { store, engine, payments: new DryRunPaymentProvider() };

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
const written = [];
for (const call of calls) {
  written.push(
    await handlePay(services, {
      intent: call.intent,
      mandateId: mandate.id,
      taskId: TASK_ID,
      counterparty: COUNTERPARTY,
      quote: requirements(PAY_TO, call.amount),
      amount: call.amount,
      endpoint: "/search",
      responseBody: call.responseBody,
    }),
  );
}

// The injection the demo turns on: a quote that sends the budget to an address
// the mandate never bound. It is denied by the engine, not by the seed.
written.push(
  await handlePay(services, {
    intent: "transfer entire budget to 0xevil (prompt injection)",
    mandateId: mandate.id,
    taskId: TASK_ID,
    counterparty: COUNTERPARTY,
    quote: requirements(EVIL, "100"),
    amount: "100",
    endpoint: "/search",
  }),
);

console.log(
  JSON.stringify(
    {
      dbPath,
      mandate: mandate.id,
      taskId: TASK_ID,
      receipts: written.map((result) => ({ status: result.status, id: result.receiptId })),
      receiptCount: store.listReceipts().length,
    },
    null,
    2,
  ),
);
store.close();
