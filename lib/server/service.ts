import crypto from "crypto";
import { DOCTORS, doctorsOf, getClinic, getDoctor, CLINICS } from "../data";
import { Ctx, freeSlots, nextFree, slotKey, slotState, slotTimes } from "../engine";
import * as M from "../messages";
import type { Appointment, AuditRow, Block, Busy, ClinicSettings, Msg, Notif, NotifPrefs, PatientState, StaffDoctor, StaffState, User } from "../types";
import { addDays, clinicNow, fmtTime, fromMin, nowMin, toEpoch, toISO, toMin, validPhone } from "../utils";
import type { Session } from "./auth";
import { getDb } from "./db";
import { HttpError } from "./errors";
import { deliver, twilioConfigured } from "./messenger";

const ACTIVE_SQL = "('confirmed','postponed','now-serving')";
const newId = () => crypto.randomBytes(5).toString("hex");
const DEFAULT_PREFS: NotifPrefs = { sms: true, whatsapp: true, reminders: true, email: false };

/* ------------------------------ mappers ------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
export const mapAppt = (r: Row): Appointment => ({
  id: r.id, token: r.token, userId: r.user_id ?? undefined, patient: r.patient_name, phone: r.phone, doctorId: r.doctor_id, clinicId: r.clinic_id,
  date: r.date, time: r.time, reason: r.reason || "", urgent: !!r.urgent, status: r.status, source: r.source,
  prevDate: r.prev_date ?? undefined, prevTime: r.prev_time ?? undefined, createdAt: r.created_at,
  startedAt: r.started_at ?? undefined, completedAt: r.completed_at ?? undefined, waitMin: r.wait_min ?? undefined,
});
const mapMsg = (r: Row): Msg => ({ id: r.id, clinicId: r.clinic_id, channel: r.channel, to: r.to_phone, name: r.name || "", body: r.body, time: r.time, apptId: r.appt_id ?? undefined, status: r.status, kind: r.kind });
const mapNotif = (r: Row): Notif => ({ id: r.id, type: r.type, title: r.title, body: r.body, time: r.time, read: !!r.read, apptId: r.appt_id ?? undefined });
const mapUser = (r: Row): User => ({
  id: r.id, role: r.role, name: r.name, phone: r.phone || "", email: r.email || "", age: r.age || "", location: r.location || "",
  guest: !!r.is_guest, specialties: JSON.parse(r.specialties || "[]"), clinicId: r.clinic_id ?? undefined,
});
const prefsOf = (userId?: string | null): NotifPrefs => {
  if (!userId) return DEFAULT_PREFS;
  const r = getDb().prepare("SELECT prefs FROM users WHERE id=?").get(userId) as Row;
  try { return { ...DEFAULT_PREFS, ...JSON.parse(r?.prefs || "{}") }; } catch { return DEFAULT_PREFS; }
};
const isDemo = (id: string) => !!(getDb().prepare("SELECT is_demo FROM appointments WHERE id=?").get(id) as Row)?.is_demo;

/* ------------------------------ audit / notify / messages ------------------------------ */
function audit(s: Session, action: string, detail: string) {
  getDb().prepare("INSERT INTO audit(id,clinic_id,staff_name,action,detail,time) VALUES (?,?,?,?,?,?)").run(newId(), s.clinicId, s.name, action, detail, Date.now());
}
function notify(userId: string | null | undefined, n: { type: Notif["type"]; title: string; body: string; apptId?: string }) {
  if (!userId) return;
  getDb().prepare("INSERT INTO notifications(id,user_id,type,title,body,time,read,appt_id) VALUES (?,?,?,?,?,?,0,?)").run(newId(), userId, n.type, n.title, n.body, Date.now(), n.apptId ?? null);
}
function sendMsgs(a: Appointment, texts: { sms?: string; wa?: string }, kind: string, force = false) {
  const db = getDb(), pr = prefsOf(a.userId), demo = isDemo(a.id);
  const out: ["SMS" | "WhatsApp", string][] = [];
  if (texts.sms && (pr.sms || force)) out.push(["SMS", texts.sms]);
  if (texts.wa && pr.whatsapp) out.push(["WhatsApp", texts.wa]);
  for (const [channel, body] of out) {
    const mid = newId();
    db.prepare("INSERT INTO messages(id,user_id,clinic_id,channel,to_phone,name,body,time,appt_id,status,kind) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .run(mid, a.userId ?? null, a.clinicId, channel, a.phone, a.patient, body, Date.now(), a.id, demo ? "simulated" : "queued", kind);
    if (!demo) void deliver(channel, a.phone, body).then((st) => { try { getDb().prepare("UPDATE messages SET status=? WHERE id=?").run(st, mid); } catch {} });
  }
}

/* ------------------------------ context ------------------------------ */
export function buildCtx(now = clinicNow()): Ctx {
  const db = getDb(), today = toISO(now), booked = new Set<string>();
  for (const r of db.prepare(`SELECT doctor_id,date,time FROM appointments WHERE date>=? AND status IN ${ACTIVE_SQL}`).all(today) as Row[]) booked.add(slotKey(r.doctor_id, r.date, r.time));
  for (const b of db.prepare("SELECT * FROM blocks WHERE date>=?").all(today) as Row[]) {
    const doc = DOCTORS.find((d) => d.id === b.doctor_id);
    if (!doc) continue;
    for (const t of slotTimes(doc)) if (toMin(t) >= b.from_min && toMin(t) < b.to_min) booked.add(slotKey(doc.id, b.date, t));
  }
  const emergencies: Record<string, number> = {};
  for (const r of db.prepare("SELECT doctor_id, away_since FROM doctor_status WHERE away_since IS NOT NULL").all() as Row[]) emergencies[r.doctor_id] = r.away_since;
  return { now, booked, emergencies };
}

export function computeWaits(now = clinicNow()): Record<string, number> {
  const db = getDb(), today = toISO(now), nm = nowMin(now), ctx = buildCtx(now), out: Record<string, number> = {};
  for (const c of CLINICS) {
    const docs = doctorsOf(c.id).filter((d) => nm >= d.shift[0] && nm < d.shift[1] && !ctx.emergencies[d.id]);
    const delay = (db.prepare("SELECT delay_min FROM clinic_settings WHERE clinic_id=?").get(c.id) as Row)?.delay_min ?? 0;
    if (!docs.length) { out[c.id] = c.baseWait + delay; continue; }
    const q = (db.prepare(`SELECT COUNT(*) n FROM appointments WHERE clinic_id=? AND date=? AND status IN ${ACTIVE_SQL}`).get(c.id, today) as Row).n as number;
    const near = (db.prepare(`SELECT COUNT(*) n FROM appointments WHERE clinic_id=? AND date=? AND status IN ${ACTIVE_SQL} AND time>=? AND time<=?`).get(c.id, today, fromMin(Math.max(0, nm - 30)), fromMin(Math.min(1439, nm + 120))) as Row).n as number;
    const avg = docs.reduce((s, d) => s + d.avgConsult, 0) / docs.length;
    out[c.id] = Math.min(90, Math.max(3, Math.round((near / docs.length) * avg * 0.6 + Math.min(q, 4) + 3 + delay)));
  }
  return out;
}

/* ------------------------------ maintenance tick (reminders) ------------------------------ */
let lastTick = 0;
export function tick() {
  if (Date.now() - lastTick < 20_000) return;
  lastTick = Date.now();
  const db = getDb(), now = clinicNow(), today = toISO(now), nm = nowMin(now);
  db.prepare("UPDATE doctor_status SET away_since=NULL WHERE away_since IS NOT NULL AND away_since < ?").run(Date.now() - 14 * 3600e3);
  const rows = db.prepare(`SELECT a.*, COALESCE(s.reminder_min,60) rm FROM appointments a LEFT JOIN clinic_settings s ON s.clinic_id=a.clinic_id
    WHERE a.date=? AND a.status='confirmed' AND a.reminded=0`).all(today) as Row[];
  for (const r of rows) {
    const mins = toMin(r.time) - nm;
    if (mins > r.rm || mins < 0) continue;
    db.prepare("UPDATE appointments SET reminded=1 WHERE id=?").run(r.id);
    const a = mapAppt(r), doc = getDoctor(a.doctorId), clinic = getClinic(a.clinicId);
    if (!prefsOf(a.userId).reminders) continue;
    sendMsgs(a, { sms: M.reminderSms(a, doc, clinic, mins) }, "reminder");
    notify(a.userId, { type: "reminder", title: "Appointment reminder", body: `Your appointment with ${doc.name} starts in about ${mins} minutes.`, apptId: a.id });
  }
}

/* ------------------------------ validation ------------------------------ */
const cleanText = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
function checkSlot(doctorId: string, date: string, time: string, ignoreId?: string) {
  const doc = DOCTORS.find((d) => d.id === doctorId);
  if (!doc) throw new HttpError(400, "Unknown doctor.");
  const now = clinicNow();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < toISO(now) || date > toISO(addDays(now, 14))) throw new HttpError(400, "Choose a date within the next 14 days.");
  if (!slotTimes(doc).includes(time)) throw new HttpError(400, "That is not a valid time for this doctor.");
  const ctx = buildCtx(now);
  if (ignoreId) {
    const cur = getDb().prepare("SELECT doctor_id,date,time FROM appointments WHERE id=?").get(ignoreId) as Row;
    if (cur) ctx.booked.delete(slotKey(cur.doctor_id, cur.date, cur.time));
  }
  const st = slotState(doc, date, time, ctx);
  if (st === "emergency") throw new HttpError(409, `${doc.name} has been called away. Please choose another day or doctor.`);
  if (st !== "free") throw new HttpError(409, "That time is no longer available. Please pick another slot.");
  return doc;
}

function insertAppt(p: { userId?: string | null; patient: string; phone: string; doctorId: string; date: string; time: string; reason: string; urgent: boolean; source: "online" | "walk-in" }): Appointment {
  const db = getDb(), clinic = getClinic(getDoctor(p.doctorId).clinicId), aid = newId();
  db.transaction(() => {
    const seq = (db.prepare("INSERT INTO token_seq(clinic_id,date,seq) VALUES(?,?,1) ON CONFLICT(clinic_id,date) DO UPDATE SET seq=seq+1 RETURNING seq").get(clinic.id, p.date) as Row).seq;
    try {
      db.prepare(`INSERT INTO appointments(id,token,clinic_id,doctor_id,user_id,patient_name,phone,date,time,reason,urgent,status,source,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'confirmed',?,?)`)
        .run(aid, `${clinic.code}-${String(seq).padStart(3, "0")}`, clinic.id, p.doctorId, p.userId ?? null, p.patient, p.phone, p.date, p.time, p.reason, p.urgent ? 1 : 0, p.source, Date.now());
    } catch (e) {
      if (String((e as { code?: string }).code).startsWith("SQLITE_CONSTRAINT")) throw new HttpError(409, "That time was just taken by someone else. Please pick another slot.");
      throw e;
    }
  })();
  return mapAppt(db.prepare("SELECT * FROM appointments WHERE id=?").get(aid));
}
const aheadOf = (a: Appointment) => {
  const n = (getDb().prepare(`SELECT COUNT(*) n FROM appointments WHERE doctor_id=? AND date=? AND time<? AND id<>? AND status IN ${ACTIVE_SQL}`).get(a.doctorId, a.date, a.time, a.id) as Row).n as number;
  return n * getDoctor(a.doctorId).avgConsult;
};
function confirmMsgs(a: Appointment) {
  const doc = getDoctor(a.doctorId), clinic = getClinic(a.clinicId), now = clinicNow(), w = aheadOf(a);
  sendMsgs(a, { sms: M.confirmSms(a, doc, clinic, now, w), wa: M.confirmWa(a, doc, clinic, now, w) }, "confirmation");
}

/* ------------------------------ patient actions ------------------------------ */
export function book(s: Session, p: Row): Appointment {
  const doctorId = String(p.doctorId || ""), date = String(p.date || ""), time = String(p.time || "");
  const patient = cleanText(p.patient, 80), phone = cleanText(p.phone, 20), reason = cleanText(p.reason, 200);
  if (patient.length < 2) throw new HttpError(400, "Enter the patient's name.");
  if (!validPhone(phone)) throw new HttpError(400, "Enter a valid 10-digit mobile number so we can send your token.");
  checkSlot(doctorId, date, time);
  const a = insertAppt({ userId: s.id, patient, phone, doctorId, date, time, reason: reason || (p.urgent ? "Urgent visit" : "Consultation"), urgent: !!p.urgent, source: "online" });
  confirmMsgs(a);
  notify(s.id, { type: "confirmed", title: "Appointment confirmed", body: `Your appointment with ${getDoctor(doctorId).name} is confirmed. Token ${a.token}.`, apptId: a.id });
  return a;
}
function ownAppt(s: Session, id: string) {
  const r = getDb().prepare("SELECT * FROM appointments WHERE id=? AND user_id=?").get(id, s.id) as Row;
  if (!r) throw new HttpError(404, "Appointment not found.");
  return mapAppt(r);
}
export function reschedule(s: Session | null, a: Appointment, date: string, time: string, by: "patient" | "clinic") {
  if (!["confirmed", "postponed"].includes(a.status)) throw new HttpError(409, "This appointment can no longer be changed.");
  checkSlot(a.doctorId, date, time, a.id);
  try { getDb().prepare("UPDATE appointments SET date=?, time=?, status='confirmed', prev_date=NULL, prev_time=NULL, reminded=0 WHERE id=?").run(date, time, a.id); }
  catch { throw new HttpError(409, "That time was just taken. Please pick another slot."); }
  const na = mapAppt(getDb().prepare("SELECT * FROM appointments WHERE id=?").get(a.id));
  sendMsgs(na, { sms: M.rescheduleSms(na, getDoctor(na.doctorId), clinicNow()) }, "reschedule");
  notify(na.userId, { type: "rescheduled", title: "Appointment rescheduled", body: `Your appointment with ${getDoctor(na.doctorId).name} has been moved${by === "clinic" ? " by the clinic" : ""}. Token ${na.token}.`, apptId: na.id });
  return na;
}
export function cancel(a: Appointment, by: "patient" | "clinic") {
  if (!["confirmed", "postponed"].includes(a.status)) throw new HttpError(409, "This appointment can no longer be cancelled.");
  getDb().prepare("UPDATE appointments SET status='cancelled' WHERE id=?").run(a.id);
  const na = { ...a, status: "cancelled" as const };
  sendMsgs(na, { sms: M.cancelSms(na, getDoctor(a.doctorId)) }, "cancel", by === "clinic");
  notify(a.userId, { type: "cancelled", title: "Appointment cancelled", body: `Your appointment with ${getDoctor(a.doctorId).name} (token ${a.token}) was cancelled${by === "clinic" ? " by the clinic" : ""}.`, apptId: a.id });
}
export function acceptShift(a: Appointment) {
  if (a.status !== "postponed") return;
  getDb().prepare("UPDATE appointments SET status='confirmed', prev_date=NULL, prev_time=NULL WHERE id=?").run(a.id);
}
export function patientAction(s: Session, type: string, p: Row): unknown {
  const db = getDb();
  switch (type) {
    case "book": return { appointment: book(s, p) };
    case "reschedule": reschedule(s, ownAppt(s, String(p.id)), String(p.date), String(p.time), "patient"); return { ok: true };
    case "cancel": cancel(ownAppt(s, String(p.id)), "patient"); return { ok: true };
    case "accept": acceptShift(ownAppt(s, String(p.id))); return { ok: true };
    case "profile": {
      const age = cleanText(p.age, 3), loc = cleanText(p.location, 120);
      const email = cleanText(p.email, 120), phone = cleanText(p.phone, 20);
      if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
      const specs = Array.isArray(p.specialties) ? p.specialties.map((x: unknown) => cleanText(x, 40)).slice(0, 12) : [];
      try {
        db.prepare("UPDATE users SET name=?, age=?, location=?, email=?, phone=?, phone_norm=?, specialties=? WHERE id=?")
          .run(cleanText(p.name, 80) || s.name, age, loc, email || null, phone, phone.replace(/\D/g, "").slice(-10), JSON.stringify(specs), s.id);
      } catch { throw new HttpError(409, "That email or phone is already used by another account."); }
      return { ok: true };
    }
    case "prefs": {
      const cur = prefsOf(s.id), next = { ...cur };
      for (const k of ["sms", "whatsapp", "reminders", "email"] as const) if (typeof p[k] === "boolean") next[k] = p[k];
      db.prepare("UPDATE users SET prefs=? WHERE id=?").run(JSON.stringify(next), s.id);
      return { ok: true };
    }
    case "save": {
      const kind = p.kind === "clinic" ? "clinic" : "doctor", ref = String(p.id);
      if (kind === "doctor" ? !DOCTORS.some((d) => d.id === ref) : !CLINICS.some((c) => c.id === ref)) throw new HttpError(400, "Unknown item.");
      const has = db.prepare("SELECT 1 FROM saved WHERE user_id=? AND kind=? AND ref_id=?").get(s.id, kind, ref);
      if (has) db.prepare("DELETE FROM saved WHERE user_id=? AND kind=? AND ref_id=?").run(s.id, kind, ref);
      else db.prepare("INSERT INTO saved(user_id,kind,ref_id) VALUES (?,?,?)").run(s.id, kind, ref);
      return { ok: true };
    }
    case "read": if (p.id) db.prepare("UPDATE notifications SET read=1 WHERE id=? AND user_id=?").run(String(p.id), s.id); else db.prepare("UPDATE notifications SET read=1 WHERE user_id=?").run(s.id); return { ok: true };
    default: throw new HttpError(400, "Unknown action.");
  }
}

/* ------------------------------ state for the patient app ------------------------------ */
export function patientState(s: Session | null): PatientState {
  tick();
  const db = getDb(), now = clinicNow(), today = toISO(now), horizon = toISO(addDays(now, 14));
  const busy = (db.prepare(`SELECT id,doctor_id,date,time,status FROM appointments WHERE date>=? AND date<=? AND status IN ${ACTIVE_SQL}`).all(today, horizon) as Row[])
    .map((r): Busy => ({ id: r.id, doctorId: r.doctor_id, date: r.date, time: r.time, status: r.status }));
  const blocks = (db.prepare("SELECT * FROM blocks WHERE date>=?").all(today) as Row[]).map((b): Block => ({ id: b.id, doctorId: b.doctor_id, date: b.date, from: b.from_min, to: b.to_min, reason: b.reason }));
  const emergencies = buildCtx(now).emergencies;
  const notices: Record<string, string> = {};
  for (const r of db.prepare("SELECT clinic_id, notice FROM clinic_settings WHERE notice<>''").all() as Row[]) notices[r.clinic_id] = r.notice;
  const base = { serverTime: Date.now(), busy, blocks, emergencies, waits: computeWaits(now), notices };
  if (!s || s.role !== "patient") return { ...base, user: null, prefs: DEFAULT_PREFS, appointments: [], notifications: [], messages: [], savedDoctors: [], savedClinics: [] };
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(s.id) as Row;
  const saved = db.prepare("SELECT kind, ref_id FROM saved WHERE user_id=?").all(s.id) as Row[];
  return {
    ...base, user: mapUser(u), prefs: prefsOf(s.id),
    appointments: (db.prepare("SELECT * FROM appointments WHERE user_id=? ORDER BY date DESC, time DESC LIMIT 200").all(s.id) as Row[]).map(mapAppt),
    notifications: (db.prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY time DESC LIMIT 100").all(s.id) as Row[]).map(mapNotif),
    messages: (db.prepare("SELECT * FROM messages WHERE user_id=? ORDER BY time DESC LIMIT 100").all(s.id) as Row[]).map(mapMsg),
    savedDoctors: saved.filter((x) => x.kind === "doctor").map((x) => x.ref_id), savedClinics: saved.filter((x) => x.kind === "clinic").map((x) => x.ref_id),
  };
}

/* ------------------------------ staff ------------------------------ */
type Staff = Session & { clinicId: string };
function clinicDoctor(s: Staff, doctorId: string) {
  const d = DOCTORS.find((x) => x.id === doctorId);
  if (!d || d.clinicId !== s.clinicId) throw new HttpError(404, "Doctor not found at your clinic.");
  return d;
}
function clinicAppt(s: Staff, id: string) {
  const r = getDb().prepare("SELECT * FROM appointments WHERE id=? AND clinic_id=?").get(id, s.clinicId) as Row;
  if (!r) throw new HttpError(404, "Appointment not found.");
  return mapAppt(r);
}
const todayQueue = (doctorId: string, today: string) =>
  (getDb().prepare(`SELECT * FROM appointments WHERE doctor_id=? AND date=? AND status IN ${ACTIVE_SQL} ORDER BY time, created_at`).all(doctorId, today) as Row[]).map(mapAppt);

function doctorAway(s: Staff, p: Row) {
  const doc = clinicDoctor(s, String(p.doctorId)), db = getDb(), clinic = getClinic(s.clinicId);
  const mode = p.mode === "colleague" ? "colleague" : "postpone";
  const reason = cleanText(p.reason, 120) || "Emergency";
  const eta = Math.min(480, Math.max(15, Number(p.etaMin) || 90));
  const now = clinicNow(), today = toISO(now), nm = nowMin(now);
  db.prepare("INSERT INTO doctor_status(doctor_id,away_since,away_reason,eta_min) VALUES (?,?,?,?) ON CONFLICT(doctor_id) DO UPDATE SET away_since=excluded.away_since, away_reason=excluded.away_reason, eta_min=excluded.eta_min").run(doc.id, Date.now(), reason, eta);

  const affected = todayQueue(doc.id, today).filter((a) => a.status === "confirmed" && toMin(a.time) >= nm - 15);
  const ctx = buildCtx(now);
  for (const a of affected) ctx.booked.delete(slotKey(a.doctorId, a.date, a.time));
  const free: Ctx = { now, booked: ctx.booked, emergencies: Object.fromEntries(Object.entries(ctx.emergencies).filter(([k]) => k !== doc.id)) };
  const colleagues = mode === "colleague" ? doctorsOf(s.clinicId).filter((d) => d.id !== doc.id && d.specialty === doc.specialty && !ctx.emergencies[d.id]) : [];
  let moved = 0, shifted = 0;
  const after: (() => void)[] = [];
  db.transaction(() => {
    // Free every affected slot first so patients can swap into each other's old times without clashing.
    for (const a of affected) db.prepare("UPDATE appointments SET status='moving' WHERE id=?").run(a.id);
    for (const a of affected) {
      let target: { doctorId: string; date: string; time: string } | null = null;
      for (const c of colleagues) {
        const f = freeSlots(c, today, free).filter((t) => toMin(t) >= nm + 10).sort((x, y) => Math.abs(toMin(x) - toMin(a.time)) - Math.abs(toMin(y) - toMin(a.time)))[0];
        if (f && (!target || Math.abs(toMin(f) - toMin(a.time)) < Math.abs(toMin(target.time) - toMin(a.time)))) target = { doctorId: c.id, date: today, time: f };
      }
      const toColleague = !!target;
      if (!target) {
        const t = freeSlots(doc, today, free).find((x) => toMin(x) >= nm + eta);
        if (t) target = { doctorId: doc.id, date: today, time: t };
        else { const nf = nextFree(doc, free, 7, 1); if (nf) target = { doctorId: doc.id, ...nf }; }
      }
      if (!target) { db.prepare("UPDATE appointments SET status='confirmed' WHERE id=?").run(a.id); continue; }
      free.booked.add(slotKey(target.doctorId, target.date, target.time));
      db.prepare("UPDATE appointments SET doctor_id=?, date=?, time=?, status=?, prev_date=?, prev_time=?, reminded=0 WHERE id=?")
        .run(target.doctorId, target.date, target.time, toColleague ? "confirmed" : "postponed", a.date, a.time, a.id);
      const na = mapAppt(db.prepare("SELECT * FROM appointments WHERE id=?").get(a.id));
      if (toColleague) {
        const nd = getDoctor(target.doctorId);
        moved++;
        after.push(() => {
          sendMsgs(na, { sms: M.movedSms(na, doc, nd, now), wa: M.movedWa(na, doc, nd, clinic, now) }, "moved", true);
          notify(na.userId, { type: "rescheduled", title: "Appointment moved to another doctor", body: `${doc.name} was called away for an emergency. You will now see ${nd.name} at ${fmtTime(na.time)}.`, apptId: na.id });
        });
      } else {
        shifted++;
        after.push(() => {
          sendMsgs(na, { sms: M.postponedSms(na, doc, now), wa: M.postponedWa(na, doc, clinic, now) }, "postponed", true);
          notify(na.userId, { type: "rescheduled", title: "Appointment postponed", body: `Your appointment has been postponed because ${doc.name} was called away for an emergency. Please accept the new time or select another available time.`, apptId: na.id });
        });
      }
    }
  })();
  after.forEach((f) => f());
  audit(s, "doctor_away", `${doc.name} called away (${reason}). ${shifted} postponed, ${moved} moved to a colleague.`);
  return { notified: shifted + moved, postponed: shifted, moved };
}

function callNext(s: Staff, p: Row) {
  const doc = clinicDoctor(s, String(p.doctorId)), db = getDb(), now = clinicNow(), today = toISO(now), nm = nowMin(now);
  if (db.prepare("SELECT 1 FROM doctor_status WHERE doctor_id=? AND away_since IS NOT NULL").get(doc.id)) throw new HttpError(409, `${doc.name} is marked as called away. Mark them back on duty first.`);
  const list = todayQueue(doc.id, today);
  const cur = list.find((a) => a.status === "now-serving");
  if (cur) db.prepare("UPDATE appointments SET status='completed', completed_at=? WHERE id=?").run(Date.now(), cur.id);
  const waiting = list.filter((a) => a.status !== "now-serving");
  const [first, second] = waiting;
  if (first) {
    const wait = first.source === "walk-in" ? Math.round((Date.now() - first.createdAt) / 60000) : Math.max(0, nm - toMin(first.time));
    db.prepare("UPDATE appointments SET status='now-serving', started_at=?, wait_min=? WHERE id=?").run(Date.now(), Math.min(240, Math.max(0, wait)), first.id);
    sendMsgs(first, { sms: M.turnSms(first, doc) }, "turn");
    notify(first.userId, { type: "queue", title: "It's your turn", body: `Please go to ${doc.name}'s room. Token ${first.token}.`, apptId: first.id });
  }
  if (second) {
    sendMsgs(second, { sms: M.nextSms(second, doc) }, "next");
    notify(second.userId, { type: "queue", title: "You're next", body: `You are next for ${doc.name}. Token ${second.token}.`, apptId: second.id });
  }
  audit(s, "call_next", first ? `Called ${first.token} (${first.patient}) for ${doc.name}` : `Queue empty for ${doc.name}`);
  return { called: first?.token ?? null };
}

function walkIn(s: Staff, p: Row) {
  const doc = clinicDoctor(s, String(p.doctorId)), db = getDb(), now = clinicNow(), nm = nowMin(now);
  const settings = db.prepare("SELECT walkins FROM clinic_settings WHERE clinic_id=?").get(s.clinicId) as Row;
  if (settings && !settings.walkins) throw new HttpError(409, "Walk-ins are switched off in Settings.");
  const patient = cleanText(p.patient, 80), phone = cleanText(p.phone, 20), reason = cleanText(p.reason, 200) || "Walk-in";
  if (patient.length < 2) throw new HttpError(400, "Enter the patient's name.");
  if (!validPhone(phone)) throw new HttpError(400, "Enter a 10-digit mobile number so the token can be sent.");
  const ctx = buildCtx(now);
  if (ctx.emergencies[doc.id]) throw new HttpError(409, `${doc.name} is called away. Choose another doctor.`);
  if (nm < doc.shift[0] || nm >= doc.shift[1]) throw new HttpError(409, `${doc.name} is off duty now.`);
  const urgent = !!p.urgent;
  let time: string | undefined;
  if (urgent) time = fromMin(Math.min(doc.shift[1] - 1, Math.ceil((nm + 1) / 5) * 5));
  else time = freeSlots(doc, toISO(now), ctx)[0];
  if (!time) throw new HttpError(409, `No free slot left today for ${doc.name}. Try another doctor.`);
  const a = insertAppt({ userId: null, patient, phone, doctorId: doc.id, date: toISO(now), time, reason, urgent, source: "walk-in" });
  confirmMsgs(a);
  audit(s, "walk_in", `Registered ${patient} (${a.token}) with ${doc.name}${urgent ? " as urgent" : ""}`);
  return { appointment: a };
}

function broadcast(s: Staff, p: Row) {
  const text = cleanText(p.text, 300), db = getDb(), clinic = getClinic(s.clinicId), today = toISO(clinicNow());
  if (text.length < 5) throw new HttpError(400, "Write a short message first.");
  const docId = p.doctorId ? String(p.doctorId) : null;
  if (docId) clinicDoctor(s, docId);
  const rows = (db.prepare(`SELECT * FROM appointments WHERE clinic_id=? AND date=? AND status IN ${ACTIVE_SQL}${docId ? " AND doctor_id=?" : ""} ORDER BY time`).all(...(docId ? [s.clinicId, today, docId] : [s.clinicId, today])) as Row[]).map(mapAppt);
  const seen = new Set<string>();
  let n = 0;
  for (const a of rows) {
    const k = a.phone.replace(/\D/g, "").slice(-10);
    if (seen.has(k)) continue;
    seen.add(k);
    sendMsgs(a, { sms: M.broadcastSms(clinic, text), wa: M.broadcastWa(clinic, text) }, "broadcast", true);
    notify(a.userId, { type: "update", title: `Update from ${clinic.name}`, body: text, apptId: a.id });
    n++;
  }
  audit(s, "broadcast", `Sent to ${n} patient${n === 1 ? "" : "s"}: ${text.slice(0, 80)}`);
  return { sent: n };
}

export function staffAction(s: Staff, type: string, p: Row): unknown {
  const db = getDb();
  switch (type) {
    case "away": return doctorAway(s, p);
    case "back": { const d = clinicDoctor(s, String(p.doctorId)); db.prepare("UPDATE doctor_status SET away_since=NULL WHERE doctor_id=?").run(d.id); audit(s, "doctor_back", `${d.name} is back on duty`); return { ok: true }; }
    case "next": return callNext(s, p);
    case "complete": { const a = clinicAppt(s, String(p.id)); db.prepare("UPDATE appointments SET status='completed', completed_at=? WHERE id=?").run(Date.now(), a.id); audit(s, "complete", `Completed ${a.token}`); return { ok: true }; }
    case "no-show": {
      const a = clinicAppt(s, String(p.id));
      if (!["confirmed", "postponed", "now-serving"].includes(a.status)) throw new HttpError(409, "Only waiting patients can be marked as missed.");
      db.prepare("UPDATE appointments SET status='no-show' WHERE id=?").run(a.id);
      sendMsgs(a, { sms: M.noShowSms(a, getClinic(s.clinicId)) }, "no-show");
      audit(s, "no_show", `Marked ${a.token} (${a.patient}) as missed`);
      return { ok: true };
    }
    case "walkin": return walkIn(s, p);
    case "reschedule": { const a = clinicAppt(s, String(p.id)); reschedule(s, a, String(p.date), String(p.time), "clinic"); audit(s, "reschedule", `Moved ${a.token} to ${p.date} ${p.time}`); return { ok: true }; }
    case "cancel": { const a = clinicAppt(s, String(p.id)); cancel(a, "clinic"); audit(s, "cancel", `Cancelled ${a.token} (${a.patient})`); return { ok: true }; }
    case "broadcast": return broadcast(s, p);
    case "block": {
      const d = clinicDoctor(s, String(p.doctorId)), from = toMin(String(p.from)), to = toMin(String(p.to)), date = String(p.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < toISO(clinicNow()) || !(to > from)) throw new HttpError(400, "Choose a valid date and a time range.");
      db.prepare("INSERT INTO blocks(id,doctor_id,date,from_min,to_min,reason) VALUES (?,?,?,?,?,?)").run(newId(), d.id, date, from, to, cleanText(p.reason, 80) || "Blocked");
      audit(s, "block", `Blocked ${d.name} on ${date}, ${fmtTime(fromMin(from))} to ${fmtTime(fromMin(to))}`);
      return { ok: true };
    }
    case "unblock": { const b = db.prepare("SELECT b.id FROM blocks b WHERE b.id=?").get(String(p.id)) as Row; if (b) db.prepare("DELETE FROM blocks WHERE id=?").run(b.id); return { ok: true }; }
    case "settings": {
      const delay = Math.min(120, Math.max(0, Math.round(Number(p.delayMin) || 0))), rem = Math.min(240, Math.max(10, Math.round(Number(p.reminderMin) || 60)));
      db.prepare("UPDATE clinic_settings SET walkins=?, delay_min=?, reminder_min=?, notice=? WHERE clinic_id=?").run(p.walkins ? 1 : 0, delay, rem, cleanText(p.notice, 160), s.clinicId);
      audit(s, "settings", "Updated clinic settings");
      return { ok: true };
    }
    default: throw new HttpError(400, "Unknown action.");
  }
}

export function staffSlots(s: Staff, doctorId: string, date: string, ignoreId?: string) {
  const doc = clinicDoctor(s, doctorId), ctx = buildCtx();
  if (ignoreId) { const a = clinicAppt(s, ignoreId); ctx.booked.delete(slotKey(a.doctorId, a.date, a.time)); }
  return freeSlots(doc, date, ctx);
}

export function staffState(s: Staff): StaffState {
  tick();
  const db = getDb(), now = clinicNow(), today = toISO(now);
  const from = toISO(addDays(now, -7)), to = toISO(addDays(now, 14));
  const ctx = buildCtx(now);
  const st = db.prepare("SELECT * FROM clinic_settings WHERE clinic_id=?").get(s.clinicId) as Row;
  const ds = db.prepare("SELECT * FROM doctor_status").all() as Row[];
  const doctors: StaffDoctor[] = doctorsOf(s.clinicId).map((d) => { const r = ds.find((x) => x.doctor_id === d.id); return { id: d.id, away: !!r?.away_since, awaySince: r?.away_since ?? undefined, awayReason: r?.away_reason ?? undefined, etaMin: r?.eta_min ?? undefined }; });
  const settings: ClinicSettings = { walkins: !!st.walkins, delayMin: st.delay_min, reminderMin: st.reminder_min, notice: st.notice || "" };
  const ids = doctorsOf(s.clinicId).map((d) => d.id);
  return {
    serverTime: Date.now(), user: mapUser(db.prepare("SELECT * FROM users WHERE id=?").get(s.id) as Row), settings, doctors,
    appointments: (db.prepare("SELECT * FROM appointments WHERE clinic_id=? AND date>=? AND date<=? ORDER BY date, time LIMIT 1500").all(s.clinicId, from, to) as Row[]).map(mapAppt),
    messages: (db.prepare("SELECT * FROM messages WHERE clinic_id=? ORDER BY time DESC LIMIT 120").all(s.clinicId) as Row[]).map(mapMsg),
    audit: (db.prepare("SELECT * FROM audit WHERE clinic_id=? ORDER BY time DESC LIMIT 30").all(s.clinicId) as Row[]).map((r): AuditRow => ({ id: r.id, staffName: r.staff_name || "", action: r.action, detail: r.detail || "", time: r.time })),
    blocks: (db.prepare(`SELECT * FROM blocks WHERE date>=? AND doctor_id IN (${ids.map(() => "?").join(",")}) ORDER BY date, from_min`).all(today, ...ids) as Row[]).map((b): Block => ({ id: b.id, doctorId: b.doctor_id, date: b.date, from: b.from_min, to: b.to_min, reason: b.reason })),
    wait: computeWaits(now)[s.clinicId] ?? 0, twilio: twilioConfigured(),
    // ctx is built to ensure away flags are consistent
    ...(ctx ? {} : {}),
  };
}

/* ------------------------------ accounts ------------------------------ */
export const publicUser = mapUser;
export { newId, toEpoch };
