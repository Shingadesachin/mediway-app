import { NextResponse } from "next/server";
import { assertSameOrigin, requireStaff } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";
import { staffAction } from "@/lib/server/service";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const s = await requireStaff();
    const { type, ...payload } = await req.json();
    return NextResponse.json(staffAction(s, String(type), payload));
  } catch (e) { return fail(e); }
}
