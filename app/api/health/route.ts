import { NextResponse } from "next/server";
import os from "os";
import { getDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Open /api/health on your deployed site. It shows whether the database works, or the exact error. */
export async function GET() {
  try {
    const db = getDb();
    const n = (db.prepare("SELECT COUNT(*) n FROM appointments").get() as { n: number }).n;
    const u = (db.prepare("SELECT COUNT(*) n FROM users").get() as { n: number }).n;
    return NextResponse.json({
      ok: true, appointments: n, users: u, host: process.env.VERCEL ? "vercel" : "other",
      sessionSecretSet: !!process.env.SESSION_SECRET, tmp: os.tmpdir(),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message, sessionSecretSet: !!process.env.SESSION_SECRET }, { status: 500 });
  }
}
