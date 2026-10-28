import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { getDb } from "./db";
import { HttpError } from "./errors";

export const COOKIE = "mw_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me-please");

export interface Session { id: string; role: "patient" | "staff" | "doctor" | "admin"; clinicId?: string; doctorId?: string; name: string; guest: boolean }

export const hashPassword = (p: string) => bcrypt.hashSync(p, 10);
export const checkPassword = (p: string, h: string | null | undefined) => !!h && bcrypt.compareSync(p, h);

const sessionLimit = (keepSignedIn: boolean) => (keepSignedIn ? 30 : 7) * 24 * 60 * 60;

async function signSession(id: string, role: string, clinicId: string | undefined, authAt: number, keepSignedIn: boolean, now: number, forcePasswordChange = false) {
  const maxAge = Math.min(24 * 60 * 60, authAt + sessionLimit(keepSignedIn) - now);
  return new SignJWT({ role, clinicId, authAt, keepSignedIn, forcePasswordChange })
    .setProtectedHeader({ alg: "HS256" }).setSubject(id).setIssuedAt(now).setExpirationTime(now + maxAge).sign(secret());
}

function setSessionCookie(token: string, maxAge: number) {
  const https = headers().get("x-forwarded-proto") === "https";
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: https, path: "/", maxAge });
}

export async function startSession(u: { id: string; role: string; clinic_id?: string | null; must_change_password?: number }, keepSignedIn = false) {
  const now = Math.floor(Date.now() / 1000);
  const token = await signSession(u.id, u.role, u.clinic_id ?? undefined, now, keepSignedIn, now, u.must_change_password === 1);
  setSessionCookie(token, 24 * 60 * 60);
}

export async function refreshSessionCookie() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return;
  try {
    const { payload } = await jwtVerify(token, secret());
    const issuedAt = Number(payload.iat || 0), now = Math.floor(Date.now() / 1000);
    const authAt = Number(payload.authAt || issuedAt), keepSignedIn = payload.keepSignedIn === true;
    const absoluteExpiry = authAt + sessionLimit(keepSignedIn);
    if (!payload.sub || !issuedAt || now >= absoluteExpiry || now - issuedAt < 3600) return;
    const maxAge = Math.min(24 * 60 * 60, absoluteExpiry - now);
    const refreshed = await signSession(String(payload.sub), String(payload.role || ""), typeof payload.clinicId === "string" ? payload.clinicId : undefined, authAt, keepSignedIn, now, payload.forcePasswordChange === true);
    setSessionCookie(refreshed, maxAge);
  } catch {
    return;
  }
}

export async function clearForcedPasswordChangeCookie() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return;
  const now = Math.floor(Date.now() / 1000);
  try {
    const { payload } = await jwtVerify(token, secret());
    const issuedAt = Number(payload.iat || 0), authAt = Number(payload.authAt || issuedAt);
    const keep = payload.keepSignedIn === true, absoluteExpiry = authAt + sessionLimit(keep);
    if (!payload.sub || now >= absoluteExpiry) return;
    const maxAge = Math.min(24 * 60 * 60, absoluteExpiry - now);
    const refreshed = await signSession(String(payload.sub), String(payload.role || ""), typeof payload.clinicId === "string" ? payload.clinicId : undefined, authAt, keep, now, false);
    setSessionCookie(refreshed, maxAge);
  } catch {
    return;
  }
}
export const endSession = () => cookies().delete(COOKIE);

/** Verifies the cookie and re-checks the account in the database on every request. */
export async function getSession(): Promise<Session | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    const issuedAt = Number(payload.iat || 0), authAt = Number(payload.authAt || issuedAt);
    if (!issuedAt || Math.floor(Date.now() / 1000) >= authAt + sessionLimit(payload.keepSignedIn === true)) return null;
    const row = getDb().prepare("SELECT id, role, clinic_id, doctor_id, name, is_guest FROM users WHERE id = ?").get(payload.sub) as
      | { id: string; role: Session["role"]; clinic_id: string | null; doctor_id: string | null; name: string; is_guest: number } | undefined;
    if (!row) return null;
    return { id: row.id, role: row.role, clinicId: row.clinic_id ?? undefined, doctorId: row.doctor_id ?? undefined, name: row.name, guest: !!row.is_guest };
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
export async function requireDoctor() {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Please log in to continue.");
  if (s.role !== "doctor" || !s.doctorId) throw new HttpError(403, "Doctor access only.");
  return s as Session & { doctorId: string };
}
export async function requireAdmin() {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Please log in to continue.");
  if (s.role !== "admin") throw new HttpError(403, "MediWay admin access only.");
  return s;
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
