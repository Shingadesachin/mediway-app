import { CLINICS, DOCTORS, Clinic, Doctor, getClinic } from "./data";
import { addDays, fmtTime, fromMin, nowMin, toISO, toMin } from "./utils";

export interface Ctx {
  now: Date;
  booked: Set<string>;
  emergencies: Record<string, number>;
}
export type SlotState = "free" | "booked" | "past" | "emergency";

export const slotKey = (doctorId: string, date: string, time: string) => `${doctorId}|${date}|${time}`;

export function slotTimes(doc: Doctor): string[] {
  const out: string[] = [];
  for (let m = doc.shift[0]; m < doc.shift[1]; m += 30) out.push(fromMin(m));
  return out;
}

export function slotState(doc: Doctor, date: string, time: string, ctx: Ctx): SlotState {
  const today = toISO(ctx.now);
  if (date < today) return "past";
  if (date === today) {
    if (toMin(time) < nowMin(ctx.now) + 10) return "past";
    if (ctx.emergencies[doc.id]) return "emergency";
  }
  if (ctx.booked.has(slotKey(doc.id, date, time))) return "booked";
  return "free";
}

export const freeSlots = (doc: Doctor, date: string, ctx: Ctx) =>
  slotTimes(doc).filter((t) => slotState(doc, date, t, ctx) === "free");

export function nextFree(doc: Doctor, ctx: Ctx, days = 7, from = 0) {
  for (let i = from; i < days; i++) {
    const date = toISO(addDays(ctx.now, i));
    const f = freeSlots(doc, date, ctx);
    if (f.length) return { date, time: f[0] };
  }
  return null;
}

export interface Avail {
  kind: "exact" | "alt" | "none" | "emergency";
  time?: string;
  label: string;
}
/** Is the doctor free at the patient's preferred date/time? If not, what is closest? */
export function availabilityAt(doc: Doctor, date: string, time: string | "", ctx: Ctx): Avail {
  const today = toISO(ctx.now);
  if (date === today && ctx.emergencies[doc.id]) return { kind: "emergency", label: "Called away for an emergency" };
  const free = freeSlots(doc, date, ctx);
  if (!free.length) return { kind: "none", label: "No slots on this date" };
  if (!time) return { kind: "exact", time: free[0], label: `Earliest slot ${fmtTime(free[0])}` };
  if (free.includes(time)) return { kind: "exact", time, label: `Free at ${fmtTime(time)}` };
  const t = toMin(time);
  const alt = [...free].sort((a, b) => Math.abs(toMin(a) - t) - Math.abs(toMin(b) - t))[0];
  return { kind: "alt", time: alt, label: `Not free at ${fmtTime(time)}. Closest: ${fmtTime(alt)}` };
}

export type LiveKey = "now" | "busy" | "off" | "emergency";
export function doctorLive(doc: Doctor, ctx: Ctx): { key: LiveKey; label: string } {
  if (ctx.emergencies[doc.id]) return { key: "emergency", label: "Called away (emergency)" };
  const nm = nowMin(ctx.now);
  if (nm < doc.shift[0] || nm >= doc.shift[1]) return { key: "off", label: "Off duty now" };
  const today = toISO(ctx.now);
  const f = freeSlots(doc, today, ctx)[0];
  if (f && toMin(f) - nm <= 45) return { key: "now", label: "Available now" };
  if (f) return { key: "busy", label: `Busy, next free ${fmtTime(f)}` };
  return { key: "busy", label: "Fully booked today" };
}

export const isClinicOpen = (c: Clinic, now: Date) => nowMin(now) >= c.open[0] && nowMin(now) < c.open[1];
export const hoursLabel = (c: Clinic) =>
  c.open[0] === 0 && c.open[1] === 1440 ? "Open 24 hours" : `${fmtTime(fromMin(c.open[0]))} to ${fmtTime(fromMin(Math.min(c.open[1], 1439)))}`;

export function queueInfo(
  appt: { doctorId: string; date: string; time: string; id: string },
  all: { id: string; doctorId: string; date: string; time: string; status: string }[],
) {
  const doc = DOCTORS.find((x) => x.id === appt.doctorId)!;
  const ahead = all.filter(
    (a) => a.id !== appt.id && a.doctorId === appt.doctorId && a.date === appt.date && ["confirmed", "postponed", "now-serving"].includes(a.status) && toMin(a.time) < toMin(appt.time),
  ).length;
  return { ahead, waitMin: ahead * doc.avgConsult };
}

export interface RecPrefs {
  specialty: string;
  date: string;
  time: string;
  maxKm: number;
  maxFee: number;
  urgent: boolean;
}
export interface Rec {
  doctor: Doctor;
  clinic: Clinic;
  score: number;
  reasons: string[];
  avail: Avail;
}

/**
 * Prototype "AI Match Score": a transparent weighted score.
 * Replace this function with a call to your recommendation model/API.
 * The score ranks convenience and fit. It is NOT a medical accuracy rating.
 */
export function recommend(p: RecPrefs, ctx: Ctx, waits: Record<string, number>): Rec[] {
  const W = p.urgent ? { spec: 30, dist: 15, avail: 30, rate: 15, fee: 10 } : { spec: 35, dist: 20, avail: 20, rate: 15, fee: 10 };
  const out: Rec[] = [];
  for (const doc of DOCTORS) {
    const clinic = getClinic(doc.clinicId);
    if (clinic.distanceKm > p.maxKm || doc.fee > p.maxFee) continue;
    if (p.urgent && !clinic.urgent) continue;
    const reasons: string[] = [];
    let spec = 0;
    if (!p.specialty) spec = doc.specialty === "General Physician" ? W.spec * 0.8 : W.spec * 0.55;
    else if (doc.specialty === p.specialty) { spec = W.spec; reasons.push(`Matches your selected specialty (${p.specialty})`); }
    else if (doc.specialty === "General Physician") { spec = W.spec * 0.4; reasons.push("A general physician is a good first stop and can refer you"); }
    else continue;
    const dist = Math.max(0.1, 1 - clinic.distanceKm / p.maxKm) * W.dist;
    if (clinic.distanceKm <= 2.5) reasons.push(`Only ${clinic.distanceKm} km away`);
    const date = p.urgent ? toISO(ctx.now) : p.date;
    const avail = availabilityAt(doc, date, p.urgent ? "" : p.time, ctx);
    let av = 0;
    if (p.urgent) {
      const open = isClinicOpen(clinic, ctx.now) && avail.kind !== "emergency" && avail.kind !== "none";
      const w = waits[clinic.id] ?? clinic.baseWait;
      av = open ? W.avail * Math.max(0.15, 1 - w / 60) : 0;
      if (open) reasons.push(`Open now with about ${w} min wait`);
    } else {
      av = avail.kind === "exact" ? W.avail : avail.kind === "alt" ? W.avail * 0.65 : 0;
      if (avail.kind === "exact") reasons.push(p.time ? `Free at your preferred time (${fmtTime(p.time)})` : "Appointments available on your date");
      else if (avail.kind === "alt") reasons.push("Slots available close to your preferred time");
    }
    const rate = Math.min(1, Math.max(0, (doc.rating - 3.5) / 1.5)) * W.rate;
    if (doc.rating >= 4.6) reasons.push(`Rated ${doc.rating} by ${doc.reviews} patients`);
    const fee = Math.max(0, 1 - doc.fee / p.maxFee) * W.fee;
    if (doc.fee <= p.maxFee * 0.6) reasons.push("Consultation fee is comfortably within your budget");
    const total = spec + dist + av + rate + fee;
    out.push({ doctor: doc, clinic, score: Math.min(99, Math.round(45 + total * 0.54)), reasons: reasons.slice(0, 4), avail });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 9);
}

/** Urgent care ranking: best-rated with the shortest wait, nearby. */
export function urgentScore(c: Clinic, wait: number) {
  return Math.round(((c.rating - 3.5) / 1.5) * 40 + Math.max(0, 1 - wait / 60) * 40 + Math.max(0, 1 - c.distanceKm / 8) * 20);
}
export const allClinics = CLINICS;
