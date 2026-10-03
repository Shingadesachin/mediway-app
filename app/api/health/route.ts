import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const n = (getDb().prepare("SELECT COUNT(*) n FROM appointments").get() as { n: number }).n;
  return NextResponse.json({ ok: true, appointments: n });
}
