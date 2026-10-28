import { NextResponse } from "next/server";
import { assertSameOrigin, requireDoctor } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";
import { doctorAction } from "@/lib/server/service";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const doctor = await requireDoctor();
    const { type, ...payload } = await req.json();
    return NextResponse.json(doctorAction(doctor, cleanText(type, 40), payload));
  } catch (error) { return fail(error); }
}
