import { DOCTORS, doctorsOf, getDoctor } from "../data";
import { slotTimes } from "../engine";
import type { Analytics } from "../types";
import { addDays, clinicNow, nowMin, toISO } from "../utils";
import { getDb } from "./db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

export function analytics(clinicId: string, days: number): Analytics {
  const db = getDb(), now = clinicNow(), today = toISO(now), nm = nowMin(now);
  days = [7, 14, 30].includes(days) ? days : 14;
  const start = toISO(addDays(now, -(days - 1))), prevStart = toISO(addDays(now, -(2 * days - 1)));
  const rows = db.prepare("SELECT * FROM appointments WHERE clinic_id=? AND date>=? AND date<=?").all(clinicId, prevStart, today) as Row[];
  const cur = rows.filter((r) => r.date >= start), prev = rows.filter((r) => r.date < start);
  const done = (r: Row) => r.status === "completed";
  const stats = (rs: Row[]) => {
    const completed = rs.filter(done).length, noShow = rs.filter((r) => r.status === "no-show").length, cancelled = rs.filter((r) => r.status === "cancelled").length;
    const held = rs.filter((r) => ["completed", "no-show"].includes(r.status)).length;
    return { total: rs.length, completed, noShow, cancelled, avgWait: avg(rs.filter((r) => done(r) && r.wait_min != null).map((r) => r.wait_min)), walkIns: rs.filter((r) => r.source === "walk-in").length, online: rs.filter((r) => r.source === "online").length, completionRate: pct(completed, rs.length), noShowRate: pct(noShow, held) };
  };
  const period = stats(cur), pp = stats(prev);

  const series = Array.from({ length: days }, (_, i) => {
    const date = toISO(addDays(now, -(days - 1 - i))), rs = cur.filter((r) => r.date === date), s = stats(rs);
    return { date, label: new Date(date + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }), total: s.total, completed: s.completed, noShow: s.noShow, cancelled: s.cancelled, avgWait: s.avgWait };
  });
  const hours = new Map<number, number>();
  for (const r of cur) if (r.status !== "cancelled") { const h = Math.floor(Number(String(r.time).slice(0, 2))); hours.set(h, (hours.get(h) || 0) + 1); }
  const hs = [...hours.keys()]; const lo = hs.length ? Math.min(...hs) : 8, hi = hs.length ? Math.max(...hs) : 20;
  const byHour = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((h) => ({ hour: `${h % 12 || 12}${h >= 12 ? "pm" : "am"}`, count: Math.round(((hours.get(h) || 0) / days) * 10) / 10 }));
  const peak = byHour.reduce((b, x) => (x.count > b.count ? x : b), { hour: "-", count: 0 });

  const byDoctor = doctorsOf(clinicId).map((d) => {
    const rs = cur.filter((r) => r.doctor_id === d.id), s = stats(rs);
    const cap = slotTimes(d).length * days;
    return { id: d.id, name: d.name, specialty: d.specialty, total: s.total, completed: s.completed, noShow: s.noShow, avgWait: s.avgWait, fill: Math.min(100, pct(rs.filter((r) => r.status !== "cancelled").length, cap)) };
  });
  const rc = new Map<string, number>();
  for (const r of cur) { const k = String(r.reason || "Consultation").toLowerCase().trim(); rc.set(k, (rc.get(k) || 0) + 1); }
  const reasons = [...rc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([reason, count]) => ({ reason: reason.charAt(0).toUpperCase() + reason.slice(1), count }));

  const t = rows.filter((r) => r.date === today), ts = stats(t);
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const msgs = (db.prepare("SELECT COUNT(*) n FROM messages WHERE clinic_id=? AND time>=?").get(clinicId, Date.now() - (now.getTime() - startOfDay.getTime())) as Row).n as number;
  const away = new Set((db.prepare("SELECT doctor_id FROM doctor_status WHERE away_since IS NOT NULL").all() as Row[]).map((r) => r.doctor_id));
  const docs = doctorsOf(clinicId);
  return {
    days,
    today: { total: ts.total, completed: ts.completed, waiting: t.filter((r) => ["confirmed", "postponed"].includes(r.status)).length, nowServing: t.filter((r) => r.status === "now-serving").length, noShow: ts.noShow, cancelled: ts.cancelled, walkIns: ts.walkIns, avgWait: ts.avgWait || period.avgWait, messages: msgs, onDuty: docs.filter((d) => nm >= d.shift[0] && nm < d.shift[1] && !away.has(d.id)).length, doctors: docs.length },
    period, prev: { total: pp.total, avgWait: pp.avgWait, noShowRate: pp.noShowRate }, series, byHour, byDoctor, reasons, peakHour: peak.hour,
  };
}
void DOCTORS; void getDoctor;
