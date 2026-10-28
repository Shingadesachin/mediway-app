import { NextResponse } from "next/server";
import { refreshSessionCookie, requireDoctor } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";
import { doctorState } from "@/lib/server/service";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await refreshSessionCookie();
    return NextResponse.json(doctorState(await requireDoctor()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
