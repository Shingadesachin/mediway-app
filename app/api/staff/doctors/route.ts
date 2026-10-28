import crypto from "crypto";
import { NextResponse } from "next/server";
import { assertSameOrigin, hashPassword, requireStaff } from "@/lib/server/auth";
import { SPECIALTIES, doctorsOf } from "@/lib/data";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";
import { sendDoctorAccess } from "@/lib/server/mailer";
import { newId } from "@/lib/server/service";
import { cleanText } from "@/lib/server/validation";
import { toMin } from "@/lib/utils";
import { refreshCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
const emailPattern = /^\S+@\S+\.\S+$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const staff = await requireStaff();
    const body = await req.json();
    const id = cleanText(body.id, 80);
    const name = cleanText(body.name, 80);
    const specialty = cleanText(body.specialty, 60);
    const fee = Number(body.fee);
    const start = cleanText(body.shiftStart, 5), end = cleanText(body.shiftEnd, 5);
    const languages = String(body.languages || "").split(",").map((value: string) => cleanText(value, 30)).filter(Boolean).slice(0, 8);
    const contactEmail = cleanText(body.contactEmail, 120).toLowerCase();
    if (name.length < 2) throw new HttpError(400, "Enter the doctor's name.");
    if (!SPECIALTIES.includes(specialty)) throw new HttpError(400, "Choose a listed specialty.");
    if (!Number.isInteger(fee) || fee < 0 || fee > 100000) throw new HttpError(400, "Enter a valid consultation fee.");
    if (!timePattern.test(start) || !timePattern.test(end) || toMin(end) <= toMin(start)) throw new HttpError(400, "Enter a valid shift range.");
    if (!languages.length) throw new HttpError(400, "Enter at least one language.");

    const db = getDb(), current = id ? doctorsOf(staff.clinicId).find((doctor) => doctor.id === id) : undefined;
    if (id && !current) throw new HttpError(404, "Doctor not found at your clinic.");
    const doctorId = current?.id || `d-${newId()}`;
    const account = db.prepare("SELECT id FROM users WHERE role='doctor' AND doctor_id=?").get(doctorId) as { id: string } | undefined;
    let delivery: "sent" | "simulated" | undefined, loginEmail: string | undefined;

    if (!account && !emailPattern.test(contactEmail)) throw new HttpError(400, "Enter the doctor's email address for portal setup.");
    const now = Date.now();
    const token = !account ? crypto.randomBytes(32).toString("hex") : "";
    db.transaction(() => {
      if (current) {
        db.prepare(`UPDATE doctors SET name=?,specialty=?,fee=?,shift_start=?,shift_end=?,languages_json=? WHERE id=? AND clinic_id=?`)
          .run(name, specialty, fee, toMin(start), toMin(end), JSON.stringify(languages), doctorId, staff.clinicId);
      } else {
        db.prepare(`INSERT INTO doctors
          (id,name,specialty,clinic_id,rating,reviews,exp,fee,shift_start,shift_end,avg_consult,languages_json,about,treats_json,status)
          VALUES (?,?,?, ?,0,0,0,?,?,?,12,?,'','[]','active')`)
          .run(doctorId, name, specialty, staff.clinicId, fee, toMin(start), toMin(end), JSON.stringify(languages));
      }
      if (!account) {
        const base = name.replace(/^Dr\.?\s*/i, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "doctor";
        let username = base, suffix = 1;
        while (db.prepare("SELECT 1 FROM users WHERE lower(email)=?").get(`${username}@mediway.app`)) username = `${base}.${++suffix}`;
        loginEmail = `${username}@mediway.app`;
        const staffId = `doctor-${doctorId}`;
        db.prepare(`INSERT INTO users(id,role,name,email,phone,phone_norm,password_hash,age,location,specialties,clinic_id,doctor_id,is_guest,created_at)
          VALUES (?,'doctor',?,?, '', '',?,'','','[]',?,?,0,?)`)
          .run(staffId, name, loginEmail, hashPassword(crypto.randomBytes(32).toString("hex")), staff.clinicId, doctorId, now);
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        db.prepare("INSERT INTO password_resets(id,user_id,token_hash,expires_at) VALUES (?,?,?,?)").run(newId(), staffId, tokenHash, now + 30 * 60_000);
      }
      db.prepare("INSERT INTO audit(id,clinic_id,staff_name,action,detail,time) VALUES (?,?,?,?,?,?)")
        .run(newId(), staff.clinicId, staff.name, current ? "doctor_update" : "doctor_add", `${current ? "Updated" : "Added"} ${name}`, now);
    })();

    refreshCatalog();
    if (loginEmail) {
      const appUrl = (process.env.APP_URL || new URL(req.url).origin).replace(/\/+$/, "");
      const resetUrl = new URL("/reset-password", appUrl);
      resetUrl.searchParams.set("token", token);
      resetUrl.searchParams.set("portal", "doctor");
      delivery = await sendDoctorAccess(contactEmail, loginEmail, resetUrl.toString());
    }
    return NextResponse.json({ ok: true, loginEmail, emailStatus: delivery });
  } catch (error) { return fail(error); }
}
