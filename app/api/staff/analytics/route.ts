import { NextResponse } from "next/server";
import { analytics } from "@/lib/server/analytics";
import { requireStaff } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const s = await requireStaff();
    const days = Number(new URL(req.url).searchParams.get("days")) || 14;
    return NextResponse.json(analytics(s.clinicId, days), { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return fail(e); }
}
