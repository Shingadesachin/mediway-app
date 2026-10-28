import { NextResponse } from "next/server";
import { assertSameOrigin, checkPassword, clearForcedPasswordChangeCookie, getSession, hashPassword } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getSession();
    if (!session) throw new HttpError(401, "Please log in to continue.");
    const body = await req.json();
    const current = String(body.currentPassword || ""), next = String(body.newPassword || "");
    if (next.length < 8 || next.length > 200) throw new HttpError(400, "Use at least 8 characters for your new password.");
    const db = getDb();
    const user = db.prepare("SELECT password_hash FROM users WHERE id=?").get(session.id) as { password_hash: string | null } | undefined;
    if (!user || !checkPassword(current, user.password_hash)) throw new HttpError(400, "Your current password is incorrect.");
    db.prepare("UPDATE users SET password_hash=?,must_change_password=0 WHERE id=?").run(hashPassword(next), session.id);
    await clearForcedPasswordChangeCookie();
    return NextResponse.json({ ok: true });
  } catch (error) { return fail(error); }
}
