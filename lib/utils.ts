export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
export const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const nowMin = (d: Date) => d.getHours() * 60 + d.getMinutes();
export const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};
export const fmtMin = (m: number) => fmtTime(fromMin(m % 1440));
export const shortDate = (iso: string) =>
  fromISO(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
export const longDate = (iso: string) =>
  fromISO(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
export function dayLabel(iso: string, now: Date) {
  const today = toISO(now);
  if (iso === today) return "Today";
  if (iso === toISO(addDays(now, 1))) return "Tomorrow";
  return shortDate(iso);
}
export const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const uid = () => Math.random().toString(36).slice(2, 10);
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}
export function timeAgo(ts: number, now: number) {
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}
export function normPhone(p: string) {
  const digits = p.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}
export const validPhone = (p: string) => p.replace(/\D/g, "").length >= 10;
export const mapsDirections = (query: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

/** Wall-clock "now" in the clinic's time zone (India). Works the same on server and browser. */
export const CLINIC_TZ = "Asia/Kolkata";
export const clinicNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: CLINIC_TZ }));
/** Epoch ms for a clinic-local date + time. */
export const toEpoch = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`).getTime();
