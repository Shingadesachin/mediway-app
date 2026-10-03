import { NextResponse } from "next/server";
import { assertSameOrigin, endSession } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try { assertSameOrigin(req); endSession(); return NextResponse.json({ ok: true }); } catch (e) { return fail(e); }
}
