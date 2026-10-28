import crypto from "crypto";
import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdmin } from "@/lib/server/auth";
import { refreshCatalog } from "@/lib/server/catalog";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";
import { sendClinicApproval } from "@/lib/server/mailer";
import { newId } from "@/lib/server/service";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
type Application = {
  id: string; clinic_name: string; address: string; area: string; lat: number; lng: number; phone: string;
  opening_hours: string; services_json: string; contact_name: string; contact_email: string;
  password_hash: string; status: string;
};

export async function GET() {
  try {
    await requireAdmin();
    const rows = getDb().prepare(`SELECT id,clinic_name,address,area,lat,lng,phone,opening_hours,services_json,
      contact_name,contact_email,status,created_at,rejection_reason FROM clinic_applications ORDER BY created_at DESC LIMIT 200`).all();
    return NextResponse.json({ applications: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json();
    const id = cleanText(body.id, 80), action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : "";
    if (!id || !action) throw new HttpError(400, "Choose a pending application and an action.");
    const db = getDb();
    const application = db.prepare("SELECT * FROM clinic_applications WHERE id=? AND status='pending'").get(id) as Application | undefined;
    if (!application) throw new HttpError(404, "Pending clinic application not found.");
    const now = Date.now();
    if (action === "reject") {
      db.prepare("UPDATE clinic_applications SET status='rejected',reviewed_at=?,reviewed_by=?,rejection_reason=? WHERE id=? AND status='pending'")
        .run(now, admin.id, cleanText(body.reason, 300), id);
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    const slugBase = application.clinic_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "clinic";
    let slug = slugBase, suffix = 1;
    while (db.prepare("SELECT 1 FROM users WHERE lower(email)=?").get(`${slug}@mediway.app`)) slug = `${slugBase}-${++suffix}`;
    let clinicId = `c-${slug}`;
    if (db.prepare("SELECT 1 FROM clinics WHERE id=?").get(clinicId)) clinicId = `${clinicId}-${newId().slice(0, 5)}`;
    const code = application.clinic_name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "MW";
    const open = JSON.parse(application.opening_hours) as [number, number];
    const services = JSON.parse(application.services_json) as string[];
    const loginEmail = `${slug}@mediway.app`;
    const staffId = `s-${newId()}`;
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    db.transaction(() => {
      db.prepare(`INSERT INTO clinics(id,code,name,area,address,lat,lng,rating,reviews,open_json,urgent,base_wait,phone,services_json,blurb,status)
        VALUES (?,?,?,?,?,?,?,0,0,?,?,15,?,?,?,'active')`).run(
        clinicId, code, application.clinic_name, application.area, application.address, application.lat, application.lng,
        JSON.stringify(open), Number(services.some((s) => /urgent|emergency/i.test(s))), application.phone,
        JSON.stringify(services), "Clinic application approved by MediWay.",
      );
      db.prepare("INSERT INTO clinic_settings(clinic_id) VALUES (?)").run(clinicId);
      db.prepare(`INSERT INTO users(id,role,name,email,phone,phone_norm,password_hash,age,location,specialties,clinic_id,is_guest,created_at,must_change_password)
        VALUES (?,'staff',?,?, '', '',?,'','','[]',?,0,?,1)`).run(staffId, application.contact_name, loginEmail, application.password_hash, clinicId, now);
      db.prepare("INSERT INTO password_resets(id,user_id,token_hash,expires_at) VALUES (?,?,?,?)").run(newId(), staffId, tokenHash, now + 30 * 60_000);
      db.prepare("UPDATE clinic_applications SET status='approved',reviewed_at=?,reviewed_by=? WHERE id=? AND status='pending'").run(now, admin.id, id);
    })();
    refreshCatalog();
    const appUrl = (process.env.APP_URL || new URL(req.url).origin).replace(/\/+$/, "");
    const resetUrl = new URL("/reset-password", appUrl);
    resetUrl.searchParams.set("token", token);
    resetUrl.searchParams.set("portal", "staff");
    const delivery = await sendClinicApproval(application.contact_email, loginEmail, resetUrl.toString());
    return NextResponse.json({ ok: true, status: "approved", loginEmail, emailStatus: delivery });
  } catch (error) { return fail(error); }
}
