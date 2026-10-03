import crypto from "crypto";
import type Database from "better-sqlite3";
import { CLINICS, DEMO_NAMES, DOCTORS, getClinic } from "../data";
import { slotTimes } from "../engine";
import * as M from "../messages";
import { addDays, clinicNow, fromMin, nowMin, toEpoch, toISO, toMin } from "../utils";
import { hashPassword } from "./auth";

const id = () => crypto.randomBytes(5).toString("hex");
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const SURNAMES = ["Shah", "Iyer", "Naik", "Fernandes", "Gupta", "Pillai", "Chavan", "Banerjee", "Malhotra", "Sheikh", "Desai", "Bose"];
const FIRST = ["Aditya", "Neha", "Rohit", "Sana", "Karan", "Divya", "Manish", "Tara", "Vivek", "Isha", "Arnav", "Zoya", "Sumit", "Rhea"];

export const DEMO_PATIENT = { email: "demo@mediway.app", password: "demo1234" };
export const DEMO_STAFF = [
  { email: "desk@mediway.app", clinic: "c1", name: "Sneha Pawar" },
  { email: "heart@mediway.app", clinic: "c2", name: "Rakesh Nambiar" },
  { email: "night@mediway.app", clinic: "c11", name: "Farida Khan" },
];
export const DEMO_STAFF_PASSWORD = "desk1234";

export function seedIfEmpty(db: Database.Database) {
  if ((db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number }).c > 0) return;
  const now = clinicNow();
  const today = toISO(now), nm = nowMin(now), R = rng(20260101);
  const ins = db.prepare(`INSERT INTO appointments(id,token,clinic_id,doctor_id,user_id,patient_name,phone,date,time,reason,urgent,status,source,is_demo,prev_date,prev_time,reminded,created_at,started_at,completed_at,wait_min)
    VALUES (@id,@token,@clinic_id,@doctor_id,@user_id,@patient_name,@phone,@date,@time,@reason,@urgent,@status,@source,1,NULL,NULL,0,@created_at,@started_at,@completed_at,@wait_min)`);
  const seqs: Record<string, { cid: string; date: string; n: number }> = {};
  const token = (cid: string, date: string) => { const k = cid + "|" + date; const e = (seqs[k] ||= { cid, date, n: 0 }); e.n++; return `${getClinic(cid).code}-${String(e.n).padStart(3, "0")}`; };
  const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)];
  const person = () => (R() < 0.5 ? pick(DEMO_NAMES) : `${pick(FIRST)} ${pick(SURNAMES)}`);
  const phone = () => `+91 9${Math.floor(100000000 + R() * 899999999)}`;

  db.transaction(() => {
    // accounts
    const u = db.prepare(`INSERT INTO users(id,role,name,email,phone,phone_norm,password_hash,age,location,specialties,clinic_id,is_guest,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)`);
    const demoId = "u-demo";
    u.run(demoId, "patient", "Aarav Mehta", DEMO_PATIENT.email, "+91 98200 12345", "9820012345", hashPassword(DEMO_PATIENT.password), "34", "Andheri West, Mumbai", JSON.stringify(["General Physician", "Dermatologist"]), null, Date.now());
    const sh = hashPassword(DEMO_STAFF_PASSWORD);
    for (const s of DEMO_STAFF) u.run("s-" + s.clinic, "staff", s.name, s.email, "", "", sh, "", "", "[]", s.clinic, Date.now());
    for (const c of CLINICS) db.prepare("INSERT INTO clinic_settings(clinic_id) VALUES (?)").run(c.id);
    db.prepare("INSERT INTO saved(user_id,kind,ref_id) VALUES (?,?,?),(?,?,?),(?,?,?)").run(demoId, "doctor", "d9", demoId, "doctor", "d6", demoId, "clinic", "c1");

    // history (21 days), today, and the next 7 days
    for (const doc of DOCTORS) {
      const clinic = getClinic(doc.clinicId);
      for (let off = -21; off <= 7; off++) {
        const dt = addDays(now, off), date = toISO(dt), dow = dt.getDay();
        const dayF = dow === 0 ? 0.4 : dow === 6 ? 0.8 : 1;
        for (const t of slotTimes(doc)) {
          const m = toMin(t), h = m / 60;
          const peak = (h >= 10 && h < 12.5) || (h >= 17 && h < 20) ? 1.35 : 1;
          const base = (clinic.urgent ? 0.52 : 0.4) * dayF * peak;
          const past = off < 0 || (off === 0 && m < nm - 5);
          if (R() > (past ? base : Math.min(base, off === 0 ? 0.45 : 0.38))) continue;
          if (off === 0 && !past && m < nm + 10) continue;
          const urgent = clinic.urgent && R() < 0.25;
          const r = R();
          let status = "confirmed", wait: number | null = null;
          if (past) {
            status = r < 0.08 ? "no-show" : r < 0.17 ? "cancelled" : "completed";
            if (status === "completed") wait = Math.max(2, Math.round(clinic.baseWait * (0.55 + R() * 0.9) + (peak > 1 ? 7 : 0)));
          } else if (R() < 0.04) status = "cancelled";
          const created = toEpoch(date, t) - Math.floor((2 + R() * 40) * 3600e3);
          ins.run({
            id: id(), token: token(clinic.id, date), clinic_id: clinic.id, doctor_id: doc.id, user_id: null, patient_name: person(), phone: phone(),
            date, time: t, reason: pick(doc.treats.length ? doc.treats : ["consultation"]), urgent: urgent ? 1 : 0, status,
            source: R() < (clinic.urgent ? 0.4 : 0.2) ? "walk-in" : "online", created_at: created,
            started_at: wait != null ? toEpoch(date, t) + wait * 60e3 : null, completed_at: wait != null ? toEpoch(date, t) + (wait + doc.avgConsult) * 60e3 : null, wait_min: wait,
          });
        }
      }
      // one patient is being seen right now for each doctor on duty
      if (nm >= doc.shift[0] && nm < doc.shift[1]) {
        const cur = db.prepare("SELECT id FROM appointments WHERE doctor_id=? AND date=? AND status='completed' AND time<=? ORDER BY time DESC LIMIT 1").get(doc.id, today, fromMin(nm)) as { id: string } | undefined;
        if (cur) db.prepare("UPDATE appointments SET status='now-serving', completed_at=NULL, started_at=? WHERE id=?").run(Date.now() - 4 * 60e3, cur.id);
      }
    }

    // the demo patient's own appointments
    const d1 = DOCTORS.find((d) => d.id === "d1")!;
    const taken = new Set((db.prepare("SELECT date||time k FROM appointments WHERE doctor_id='d1' AND status IN ('confirmed','postponed','now-serving')").all() as { k: string }[]).map((r) => r.k));
    let slot: { date: string; time: string } | null = null;
    for (let i = 0; i < 6 && !slot; i++) {
      const date = toISO(addDays(now, i));
      const t = slotTimes(d1).find((x) => !taken.has(date + x) && (i > 0 || toMin(x) >= nm + 90));
      if (t) slot = { date, time: t };
    }
    slot = slot || { date: toISO(addDays(now, 1)), time: "10:30" };
    const mine = (doc: string, date: string, time: string, reason: string, status: string, wait: number | null) => {
      const d = DOCTORS.find((x) => x.id === doc)!;
      const rec = { id: id(), token: token(d.clinicId, date), clinic_id: d.clinicId, doctor_id: doc, user_id: demoId, patient_name: "Aarav Mehta", phone: "+91 98200 12345", date, time, reason, urgent: 0, status, source: "online", created_at: Date.now() - 864e5, started_at: null, completed_at: null, wait_min: wait };
      ins.run(rec);
      return rec;
    };
    mine("d1", toISO(addDays(now, -12)), "10:30", "Fever and body ache", "completed", 11);
    mine("d6", toISO(addDays(now, -34)), "12:00", "Persistent skin rash", "completed", 9);
    const up = mine("d1", slot.date, slot.time, "Follow-up consultation", "confirmed", null);
    db.prepare("INSERT INTO notifications(id,user_id,type,title,body,time,read,appt_id) VALUES (?,?,?,?,?,?,0,?)").run(id(), demoId, "confirmed", "Appointment confirmed", `Your appointment with ${d1.name} is confirmed. Token ${up.token}.`, Date.now() - 36e5, up.id);

    // a few recent outbox entries so the staff message log is not empty on first run
    const recent = db.prepare("SELECT * FROM appointments WHERE date=? AND status='confirmed' ORDER BY time LIMIT 14").all(today) as any[];
    const m = db.prepare("INSERT INTO messages(id,user_id,clinic_id,channel,to_phone,name,body,time,appt_id,status,kind) VALUES (?,?,?,?,?,?,?,?,?,'simulated',?)");
    recent.forEach((a, i) => {
      const doc = DOCTORS.find((d) => d.id === a.doctor_id)!, clinic = getClinic(a.clinic_id);
      const A = { token: a.token, date: a.date, time: a.time };
      m.run(id(), a.user_id, a.clinic_id, i % 2 ? "SMS" : "WhatsApp", a.phone, a.patient_name, i % 2 ? M.confirmSms(A, doc, clinic, now, 10) : M.confirmWa(A, doc, clinic, now, 10), Date.now() - (i + 2) * 7 * 60e3, a.id, "confirmation");
    });
    db.prepare("INSERT INTO messages(id,user_id,clinic_id,channel,to_phone,name,body,time,appt_id,status,kind) VALUES (?,?,?,?,?,?,?,?,?,'simulated','confirmation')")
      .run(id(), demoId, d1.clinicId, "WhatsApp", "+91 98200 12345", "Aarav Mehta", M.confirmWa({ token: up.token, date: up.date, time: up.time }, d1, getClinic(d1.clinicId), now, 12), Date.now() - 36e5, up.id);
    // token sequence continues after the seeded history
    for (const e of Object.values(seqs)) db.prepare("INSERT INTO token_seq(clinic_id,date,seq) VALUES (?,?,?) ON CONFLICT(clinic_id,date) DO UPDATE SET seq=excluded.seq").run(e.cid, e.date, e.n);
  })();
}
