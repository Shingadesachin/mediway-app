import { NextResponse } from "next/server";
import { assertSameOrigin, requirePatient } from "@/lib/server/auth";
import { fail } from "@/lib/server/errors";
import { patientAction } from "@/lib/server/service";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const s = await requirePatient();
    const { type, ...payload } = await req.json();
    return NextResponse.json(patientAction(s, cleanText(type, 40), payload));
  } catch (e) { return fail(e); }
}
