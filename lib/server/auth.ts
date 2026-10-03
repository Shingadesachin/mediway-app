import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { getDb } from "./db";
import { HttpError } from "./errors";

export const COOKIE = "mw_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me-please");

export interface Session { id: string; role: "patient" | "staff"; clinicId?: string; name: string; guest: boolean }

export const hashPassword = (p: string) => bcrypt.hashSync(p, 10);
export const checkPassword = (p: string, h: string | null | undefined) => !!h && bcrypt.compareSync(p, h);

export async function startSession(u: { id: string; role: string; clinic_id?: string | null }) {
  const token = await new SignJWT({ role: u.role, clinicId: u.clinic_id ?? undefined })
    .setProtectedHeader({ alg: "HS256" }).setSubject(u.id).setIssuedAt().setExpirationTime(u.role === "staff" ? "12h" : "14d").sign(secret());
  const https = headers().get("x-forwarded-proto") === "https";
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: https, path: "/", maxAge: u.role === "staff" ? 43200 : 1209600 });
}
export const endSession = () => cookies().delete(COOKIE);

/** Verifies the cookie and re-checks the account in the database on every request. */
export async function getSession(): Promise<Session | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    const row = getDb().prepare("SELECT id, role, clinic_id, name, is_guest FROM users WHERE id = ?").get(payload.sub) as
      | { id: string; role: "patient" | "staff"; clinic_id: string | null; name: string; is_guest: number } | undefined;
    if (!row) return null;
    return { id: row.id, role: row.role, clinicId: row.clinic_id ?? undefined, name: row.name, guest: !!row.is_guest };
  } catch {
    return null;
  }
}
export async function requirePatient() {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Please log in to continue.");
  if (s.role !== "patient") throw new HttpError(403, "This is a clinic staff account. Use the patient app with a patient login.");
  return s;
}
export async function requireStaff() {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Please log in to continue.");
  if (s.role !== "staff" || !s.clinicId) throw new HttpError(403, "Clinic staff access only.");
  return s as Session & { clinicId: string };
}

/** Basic CSRF defence for cookie auth: mutating requests must come from our own origin. */
export function assertSameOrigin(req: Request) {
  const o = req.headers.get("origin");
  if (!o) return;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try { if (new URL(o).host !== host) throw 0; } catch { throw new HttpError(403, "Request blocked."); }
}

const hits = new Map<string, { n: number; t: number }>();
export function rateLimit(key: string, max = 8, windowMs = 10 * 60_000) {
  const now = Date.now(), h = hits.get(key);
  if (!h || now - h.t > windowMs) { hits.set(key, { n: 1, t: now }); return; }
  if (++h.n > max) throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
}
export const clearLimit = (key: string) => hits.delete(key);
