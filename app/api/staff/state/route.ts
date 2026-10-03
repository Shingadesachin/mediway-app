import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";
import { staffState } from "@/lib/server/service";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(staffState(await requireStaff()), { headers: { "Cache-Control": "no-store" } }); } catch (e) { return fail(e); }
}
