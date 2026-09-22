import { NextResponse } from "next/server";
import { LedgerootStore } from "ledgeroot";

export const dynamic = "force-dynamic";

/**
 * This endpoint has no authentication — it is a local dashboard talking to a
 * local database — so a browser is the only thing distinguishing the user's own
 * click from a page the user happens to have open. Both cross-site hints the
 * browser sends are checked, and a request that carries neither (a local script
 * or CLI) is allowed, because that is not the CSRF shape.
 */
function sameOrigin(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return true;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "cross-origin request refused" }, { status: 403 });
  }

  // The action has to be named explicitly. A malformed or empty body used to
  // fall through to "revoke everything", which turned any cross-site form POST
  // (and any buggy client) into the kill switch.
  const body = (await request.json().catch(() => null)) as
    | { mandateId?: unknown; all?: unknown }
    | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "expected a JSON body naming a mandateId or all: true" },
      { status: 400 },
    );
  }

  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    if (typeof body.mandateId === "string" && body.mandateId !== "") {
      const revoked = store.revokeMandate(body.mandateId);
      return NextResponse.json({ revoked: revoked ? 1 : 0 });
    }
    if (body.all === true) {
      const revoked = store.revokeAllMandates();
      return NextResponse.json({ revoked });
    }
    return NextResponse.json(
      { error: "expected a mandateId or all: true" },
      { status: 400 },
    );
  } finally {
    store.close();
  }
}
