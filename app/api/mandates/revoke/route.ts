import { NextResponse } from "next/server";
import { LedgerootStore } from "ledgeroot";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { mandateId?: string };
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    if (body.mandateId) {
      const revoked = store.revokeMandate(body.mandateId);
      return NextResponse.json({ revoked: revoked ? 1 : 0 });
    }
    const revoked = store.revokeAllMandates();
    return NextResponse.json({ revoked });
  } finally {
    store.close();
  }
}
