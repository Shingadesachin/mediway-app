import { NextResponse } from "next/server";
import { assertSameOrigin, hashPassword, rateLimit } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";
import { newId } from "@/lib/server/service";
import { cleanText } from "@/lib/server/validation";
import { normPhone, validPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    rateLimit(`clinic-application:${ip}`, 4, 60 * 60_000);
    const body = await req.json();
    const clinicName = cleanText(body.clinicName, 100), address = cleanText(body.address, 240), area = cleanText(body.area, 100);
    const contactName = cleanText(body.contactName, 80), contactEmail = cleanText(body.contactEmail, 120).toLowerCase();
    const rawPhone = cleanText(body.phone, 40), password = String(body.password || "");
    const lat = Number(body.lat), lng = Number(body.lng), open = [Number(body.openTime), Number(body.closeTime)];
    const services = Array.isArray(body.services) ? body.services.map((x: unknown) => cleanText(x, 60)).filter(Boolean).slice(0, 20) : [];
    if (clinicName.length < 2 || address.length < 8 || area.length < 2 || contactName.length < 2) throw new HttpError(400, "Complete the clinic, address, area, and contact name.");
    if (!/^\S+@\S+\.\S+$/.test(contactEmail)) throw new HttpError(400, "Enter a valid contact email.");
    if (!validPhone(rawPhone)) throw new HttpError(400, "Enter a valid phone number for the selected country.");
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) throw new HttpError(400, "Set a valid location pin.");
    if (open.some((n) => !Number.isInteger(n) || n < 0 || n > 1440) || open[0] >= open[1]) throw new HttpError(400, "Choose valid opening hours.");
    if (services.length === 0) throw new HttpError(400, "Enter at least one clinic service.");
    if (password.length < 8 || password.length > 200) throw new HttpError(400, "Use at least 8 characters for your password.");
    const db = getDb();
    const applicationId = newId();
    db.prepare(`INSERT INTO clinic_applications
      (id,clinic_name,address,area,lat,lng,phone,opening_hours,services_json,contact_name,contact_email,password_hash,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending',?)`).run(
      applicationId, clinicName, address, area, lat, lng, normPhone(rawPhone), JSON.stringify(open), JSON.stringify(services),
      contactName, contactEmail, hashPassword(password), Date.now(),
    );
    return NextResponse.json({ ok: true, id: applicationId });
  } catch (error) { return fail(error); }
}
