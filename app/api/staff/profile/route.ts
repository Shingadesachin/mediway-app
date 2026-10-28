import { NextResponse } from "next/server";
import { assertSameOrigin, requireStaff } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireStaff();
    const body = await req.json(), name = cleanText(body.name, 80), email = cleanText(body.email, 120).toLowerCase();
    if (name.length < 2) throw new HttpError(400, "Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
    try { getDb().prepare("UPDATE users SET name=?,email=? WHERE id=? AND role='staff' AND clinic_id=?").run(name, email, session.id, session.clinicId); }
    catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new HttpError(409, "That email address is already in use.");
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return fail(error); }
}
