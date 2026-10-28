import { NextResponse } from "next/server";
import { assertSameOrigin, requireStaff } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const staff = await requireStaff();
    const body = await req.json();
    const db = getDb();
    if (body.all === true) db.prepare("UPDATE staff_notifications SET read=1 WHERE clinic_id=?").run(staff.clinicId);
    else {
      const id = cleanText(body.id, 80);
      if (!id) throw new HttpError(400, "Choose a notification.");
      db.prepare("UPDATE staff_notifications SET read=1 WHERE id=? AND clinic_id=?").run(id, staff.clinicId);
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return fail(error); }
}
