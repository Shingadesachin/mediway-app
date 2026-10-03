import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me-please");
const PATIENT = ["/dashboard", "/urgent-care", "/recommendations", "/find-doctor", "/clinics", "/book", "/confirmation", "/appointments", "/notifications", "/profile"];
const under = (p: string, list: string[]) => list.some((x) => p === x || p.startsWith(x + "/"));

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let role: string | null = null;
  const t = req.cookies.get("mw_session")?.value;
  if (t) { try { role = String((await jwtVerify(t, secret())).payload.role); } catch { role = null; } }
  const go = (to: string, keepNext = false) => {
    const u = req.nextUrl.clone(); u.pathname = to; u.search = "";
    if (keepNext) u.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(u);
  };
  if (pathname.startsWith("/staff")) {
    if (pathname === "/staff/login") return role === "staff" ? go("/staff") : NextResponse.next();
    return role === "staff" ? NextResponse.next() : go("/staff/login");
  }
  if (under(pathname, PATIENT)) {
    if (role === "staff") return go("/staff");
    return role ? NextResponse.next() : go("/login", true);
  }
  if (pathname === "/login" || pathname === "/signup") return role === "staff" ? go("/staff") : role ? go("/dashboard") : NextResponse.next();
  return NextResponse.next();
}
export const config = { matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"] };
