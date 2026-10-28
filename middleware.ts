import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me-please");
const PATIENT = ["/dashboard", "/urgent-care", "/recommendations", "/find-doctor", "/clinics", "/book", "/confirmation", "/appointments", "/notifications", "/profile"];
const under = (p: string, list: string[]) => list.some((x) => p === x || p.startsWith(x + "/"));
const home = (role: string | null) => role === "staff" ? "/staff" : role === "doctor" ? "/doctor" : role === "admin" ? "/admin" : "/dashboard";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let role: string | null = null;
  const t = req.cookies.get("mw_session")?.value;
  let refreshed: string | null = null;
  let payload: Record<string, unknown> | null = null;
  if (t) {
    try {
      payload = (await jwtVerify(t, secret())).payload as Record<string, unknown>;
      const now = Math.floor(Date.now() / 1000);
      const issuedAt = Number(payload.iat || 0), authAt = Number(payload.authAt || issuedAt);
      const keep = payload.keepSignedIn === true, maxAge = (keep ? 30 : 7) * 86400;
      if (!issuedAt || now >= authAt + maxAge) throw new Error("Session expired");
      role = String(payload.role);
      if (now - issuedAt >= 3600 && payload.sub) {
        const expires = Math.min(now + 86400, authAt + maxAge);
        refreshed = await new SignJWT({ role: payload.role, clinicId: payload.clinicId, authAt, keepSignedIn: keep, forcePasswordChange: payload.forcePasswordChange === true })
          .setProtectedHeader({ alg: "HS256" }).setSubject(String(payload.sub)).setIssuedAt(now).setExpirationTime(expires).sign(secret());
      }
    } catch { role = null; }
  }
  const next = () => {
    const response = NextResponse.next();
    if (refreshed) response.cookies.set("mw_session", refreshed, {
      httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
      path: "/", maxAge: Math.max(0, Math.min(86400, Number(payload?.authAt || payload?.iat) + (payload?.keepSignedIn === true ? 30 : 7) * 86400 - Math.floor(Date.now() / 1000))),
    });
    return response;
  };
  const go = (to: string, keepNext = false) => {
    const u = req.nextUrl.clone(); u.pathname = to; u.search = "";
    if (keepNext) u.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(u);
  };
  if (role === "staff" && payload?.forcePasswordChange === true && !["/staff/profile", "/staff/login", "/reset-password"].includes(pathname)) {
    const u = req.nextUrl.clone(); u.pathname = "/staff/profile"; u.searchParams.set("forcePassword", "1");
    return NextResponse.redirect(u);
  }
  if (pathname.startsWith("/staff")) {
    if (pathname === "/staff/signup") return role ? go(home(role)) : next();
    if (pathname === "/staff/login") return role ? go(home(role)) : next();
    return role === "staff" ? next() : role ? go(home(role)) : go("/staff/login");
  }
  if (under(pathname, PATIENT)) {
    return role === "patient" ? next() : role ? go(home(role)) : go("/login", true);
  }
  if (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/doctor/login" || pathname === "/admin/login") return role ? go(home(role)) : next();
  if (pathname.startsWith("/doctor")) return role === "doctor" ? next() : role ? go(home(role)) : go("/doctor/login");
  if (pathname.startsWith("/admin")) return role === "admin" ? next() : role ? go(home(role)) : go("/admin/login");
  return next();
}
export const config = { matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"] };
