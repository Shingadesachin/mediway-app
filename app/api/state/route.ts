import { NextResponse } from "next/server";
import { getSession, refreshSessionCookie } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";
import { patientState } from "@/lib/server/service";

export const dynamic = "force-dynamic";
export async function GET() {
  try { await refreshSessionCookie(); return NextResponse.json(patientState(await getSession()), { headers: { "Cache-Control": "no-store" } }); } catch (e) { return fail(e); }
}
