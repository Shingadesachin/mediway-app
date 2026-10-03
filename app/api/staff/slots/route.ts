import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";
import { staffSlots } from "@/lib/server/service";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const s = await requireStaff(), q = new URL(req.url).searchParams;
    return NextResponse.json({ slots: staffSlots(s, q.get("doctorId") || "", q.get("date") || "", q.get("ignore") || undefined) });
  } catch (e) { return fail(e); }
}
