import crypto from "crypto";
import { NextResponse } from "next/server";
import { assertSameOrigin, clearForcedPasswordChangeCookie, hashPassword, rateLimit } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await req.json();
    const token = String(body.token || "").trim();
    const password = String(body.password || "");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    rateLimit(`reset:ip:${ip}`, 10, 10 * 60_000);
    if (!/^[a-f0-9]{64}$/i.test(token)) throw new HttpError(400, "This reset link is invalid or expired. Request a new one.");
    if (password.length < 8 || password.length > 200) throw new HttpError(400, "Use at least 8 characters for your password.");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const db = getDb(), now = Date.now();
    const row = db.prepare("SELECT id,user_id FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>?")
      .get(tokenHash, now) as { id: string; user_id: string } | undefined;
    if (!row) throw new HttpError(400, "This reset link is invalid or expired. Request a new one.");
    const changed = db.transaction(() => {
      const result = db.prepare("UPDATE password_resets SET used_at=? WHERE id=? AND used_at IS NULL AND expires_at>?").run(now, row.id, now);
      if (!result.changes) return false;
      db.prepare("UPDATE users SET password_hash=?,must_change_password=0 WHERE id=?").run(hashPassword(password), row.user_id);
      return true;
    })();
    if (!changed) throw new HttpError(400, "This reset link is invalid or expired. Request a new one.");
    await clearForcedPasswordChangeCookie();
    return NextResponse.json({ ok: true });
  } catch (error) { return fail(error); }
}
