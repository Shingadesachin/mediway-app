import { NextResponse } from "next/server";
import { assertSameOrigin, hashPassword, rateLimit, startSession } from "@/lib/server/auth";
import { refreshCatalog } from "@/lib/server/catalog";
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
    rateLimit(`clinic-signup:${ip}`, 5, 60 * 60_000);
    const body = await req.json();
    const clinicName = cleanText(body.clinicName, 100);
    const address = cleanText(body.address, 240);
    const area = cleanText(body.area, 100);
    const contactName = cleanText(body.contactName, 80);
    const email = cleanText(body.contactEmail, 120).toLowerCase();
    const rawPhone = cleanText(body.phone, 40);
    const password = String(body.password || "");
    const lat = Number(body.lat), lng = Number(body.lng);
    const openingHours = [Number(body.openTime), Number(body.closeTime)];
    const services = Array.isArray(body.services)
      ? body.services.map((service: unknown) => cleanText(service, 60)).filter(Boolean).slice(0, 20)
      : [];

    if (clinicName.length < 2 || address.length < 8 || area.length < 2 || contactName.length < 2) {
      throw new HttpError(400, "Complete the clinic, address, area, and contact name.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid login email.");
    if (!validPhone(rawPhone)) throw new HttpError(400, "Enter a valid phone number for the selected country.");
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      throw new HttpError(400, "Set a valid clinic location.");
    }
    if (openingHours.some((value) => !Number.isInteger(value) || value < 0 || value > 1440) || openingHours[0] >= openingHours[1]) {
      throw new HttpError(400, "Choose valid opening hours.");
    }
    if (services.length === 0) throw new HttpError(400, "Enter at least one clinic service.");
    if (password.length < 8 || password.length > 200) throw new HttpError(400, "Use at least 8 characters for your password.");

    const db = getDb();
    if (db.prepare("SELECT 1 FROM users WHERE lower(email)=?").get(email)) {
      throw new HttpError(409, "An account with this email already exists. Log in instead.");
    }

    const slugBase = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "clinic";
    let clinicId = `c-${slugBase}`;
    let suffix = 1;
    while (db.prepare("SELECT 1 FROM clinics WHERE id=?").get(clinicId)) clinicId = `c-${slugBase}-${++suffix}`;

    const codeBase = clinicName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase().slice(0, 4) || "MW";
    let code = codeBase;
    suffix = 1;
    while (db.prepare("SELECT 1 FROM clinics WHERE code=?").get(code)) code = `${codeBase.slice(0, 3)}${++suffix}`;

    const staffId = `s-${newId()}`;
    const now = Date.now();
    db.transaction(() => {
      db.prepare(`INSERT INTO clinics(id,code,name,area,address,lat,lng,rating,reviews,open_json,urgent,base_wait,phone,services_json,blurb,status)
        VALUES (?,?,?,?,?,?,?,0,0,?,?,15,?,?,?,'active')`).run(
        clinicId, code, clinicName, area, address, lat, lng,
        JSON.stringify(openingHours), Number(services.some((service: string) => /urgent|emergency/i.test(service))),
        normPhone(rawPhone), JSON.stringify(services), "Registered directly through MediWay.",
      );
      db.prepare("INSERT INTO clinic_settings(clinic_id) VALUES (?)").run(clinicId);
      db.prepare(`INSERT INTO users(id,role,name,email,phone,phone_norm,password_hash,age,location,specialties,clinic_id,is_guest,created_at)
        VALUES (?,'staff',?,?, '', '',?,'','','[]',?,0,?)`).run(
        staffId, contactName, email, hashPassword(password), clinicId, now,
      );
    })();

    refreshCatalog();
    await startSession({ id: staffId, role: "staff", clinic_id: clinicId });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
