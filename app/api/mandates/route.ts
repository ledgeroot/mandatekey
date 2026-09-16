import { NextResponse } from "next/server";
import { LedgerootStore } from "ledgeroot";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = new LedgerootStore({
    path: process.env.LEDGEROOT_DB ?? "ledgeroot.sqlite",
  });
  try {
    return NextResponse.json({ mandates: store.listMandates() });
  } finally {
    store.close();
  }
}
