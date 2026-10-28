import crypto from "crypto";
import { NextResponse } from "next/server";
import { assertSameOrigin, rateLimit } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";
import { sendPasswordReset } from "@/lib/server/mailer";
import { newId } from "@/lib/server/service";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
const GENERIC = "If an account exists for that email, password reset instructions will be sent.";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await req.json().catch(() => ({}));
    const email = cleanText(body.email, 120).toLowerCase();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    rateLimit(`forgot:ip:${ip}`, 12, 10 * 60_000);
    if (email) rateLimit(`forgot:email:${email}`, 4, 30 * 60_000);
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ ok: true, message: GENERIC });

    const db = getDb();
    const user = db.prepare("SELECT id,email,role FROM users WHERE lower(email)=? AND is_guest=0 AND role IN ('patient','staff','doctor','admin')").get(email) as { id: string; email: string; role: string } | undefined;
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const now = Date.now();
      db.transaction(() => {
        db.prepare("UPDATE password_resets SET used_at=? WHERE user_id=? AND used_at IS NULL").run(now, user.id);
        db.prepare("INSERT INTO password_resets(id,user_id,token_hash,expires_at) VALUES (?,?,?,?)")
          .run(newId(), user.id, tokenHash, now + 30 * 60_000);
      })();
      const base = (process.env.APP_URL || new URL(req.url).origin).replace(/\/+$/, "");
      const resetUrl = new URL("/reset-password", base);
      resetUrl.searchParams.set("token", token);
      if (user.role !== "patient") resetUrl.searchParams.set("portal", user.role);
      try {
        await sendPasswordReset(user.email, resetUrl.toString());
      } catch (error) {
        console.error("[MediWay] Password reset email could not be sent.", error);
      }
    }
    return NextResponse.json({ ok: true, message: GENERIC });
  } catch (error) {
    if (error instanceof HttpError && error.status === 429) return fail(error);
    if (error instanceof HttpError && error.status === 403) return fail(error);
    console.error("[MediWay] Password reset request failed.", error);
    return NextResponse.json({ ok: true, message: GENERIC });
  }
}
