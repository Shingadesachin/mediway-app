import { NextResponse } from "next/server";
import { assertSameOrigin, checkPassword, clearLimit, hashPassword, rateLimit, startSession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { HttpError, fail } from "@/lib/server/errors";

export const dynamic = "force-dynamic";
const DUMMY = hashPassword("not-a-real-password");

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const { identifier, password, portal } = await req.json();
    const key = String(identifier || "").trim().toLowerCase();
    if (!key || !password) throw new HttpError(400, "Enter your phone or email and your password.");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    rateLimit(`login:${ip}:${key}`);
    const digits = key.replace(/\D/g, "").slice(-10);
    const u = getDb().prepare("SELECT * FROM users WHERE is_guest=0 AND (lower(email)=? OR (? <> '' AND phone_norm=?)) LIMIT 1").get(key, key.includes("@") || digits.length < 10 ? "" : digits, digits) as
      | { id: string; role: string; clinic_id: string | null; password_hash: string; name: string } | undefined;
    const ok = checkPassword(String(password), u?.password_hash ?? DUMMY) && !!u;
    if (!u || !ok) throw new HttpError(401, "That phone/email and password don't match. Check them and try again.");
    if (portal === "staff" && u.role !== "staff") throw new HttpError(403, "This is a patient account. Use the patient login.");
    if (portal !== "staff" && u.role === "staff") throw new HttpError(403, "This is a clinic staff account. Use the clinic login.");
    clearLimit(`login:${ip}:${key}`);
    await startSession(u);
    return NextResponse.json({ ok: true, role: u.role });
  } catch (e) { return fail(e); }
}
