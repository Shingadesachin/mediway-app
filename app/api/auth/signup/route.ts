import { NextResponse } from "next/server";
import { assertSameOrigin, hashPassword, rateLimit, startSession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { HttpError, fail } from "@/lib/server/errors";
import { newId } from "@/lib/server/service";
import { validPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(`signup:${req.headers.get("x-forwarded-for") || "local"}`, 10);
    const b = await req.json();
    const name = String(b.name || "").trim().slice(0, 80), email = String(b.email || "").trim().toLowerCase().slice(0, 120), phone = String(b.phone || "").trim().slice(0, 20), pw = String(b.password || "");
    if (name.length < 2) throw new HttpError(400, "Enter your full name.");
    if (!validPhone(phone)) throw new HttpError(400, "Enter a 10-digit mobile number.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
    if (pw.length < 8) throw new HttpError(400, "Use at least 8 characters for your password.");
    const db = getDb(), norm = phone.replace(/\D/g, "").slice(-10);
    if (db.prepare("SELECT 1 FROM users WHERE lower(email)=? OR (phone_norm=? AND is_guest=0)").get(email, norm)) throw new HttpError(409, "An account with this phone or email already exists. Log in instead.");
    const id = "u-" + newId();
    db.prepare("INSERT INTO users(id,role,name,email,phone,phone_norm,password_hash,created_at) VALUES (?,?,?,?,?,?,?,?)").run(id, "patient", name, email, phone, norm, hashPassword(pw), Date.now());
    db.prepare("INSERT INTO notifications(id,user_id,type,title,body,time,read) VALUES (?,?,?,?,?,?,0)").run(newId(), id, "update", "Welcome to MediWay", "Search for a clinic or doctor, pick a time, and get a token on WhatsApp and SMS.", Date.now());
    await startSession({ id, role: "patient" });
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
