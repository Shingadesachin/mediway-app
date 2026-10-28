import { NextResponse } from "next/server";
import { assertSameOrigin, checkPassword, clearLimit, hashPassword, rateLimit, startSession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { HttpError, fail } from "@/lib/server/errors";
import { normPhone } from "@/lib/utils";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
const DUMMY = hashPassword("not-a-real-password");

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await req.json();
    const key = cleanText(body.identifier, 120).toLowerCase();
    const password = String(body.password || "");
    const portal = ["staff", "doctor", "admin"].includes(body.portal) ? String(body.portal) : "patient";
    if (!key || !password || password.length > 200) throw new HttpError(400, "Enter your phone or email and your password.");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    rateLimit(`login:${ip}:${key}`);
    const phone = key.includes("@") ? "" : normPhone(key);
    const u = getDb().prepare("SELECT * FROM users WHERE is_guest=0 AND (lower(email)=? OR (? <> '' AND phone_norm=?)) LIMIT 1").get(key, phone, phone) as
      | { id: string; role: string; clinic_id: string | null; doctor_id: string | null; must_change_password: number; password_hash: string; name: string } | undefined;
    const ok = checkPassword(String(password), u?.password_hash ?? DUMMY) && !!u;
    if (!u || !ok) throw new HttpError(401, "That phone/email and password don't match. Check them and try again.");
    if (portal === "staff" && u.role !== "staff") throw new HttpError(403, "This is not a clinic staff account. Use the correct login.");
    if (portal === "patient" && u.role !== "patient") throw new HttpError(403, "This account belongs to another portal. Use the correct login.");
    if (portal === "doctor" && u.role !== "doctor") throw new HttpError(403, "This is not a doctor account.");
    if (portal === "admin" && u.role !== "admin") throw new HttpError(403, "This is not a MediWay admin account.");
    clearLimit(`login:${ip}:${key}`);
    await startSession(u, body.keepSignedIn === true);
    return NextResponse.json({ ok: true, role: u.role, mustChangePassword: u.must_change_password === 1 });
  } catch (e) { return fail(e); }
}
