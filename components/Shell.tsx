"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Bell, Building2, CalendarCheck, HeartPulse, Home, LogOut, Siren, Sparkles, Stethoscope, User as UserIcon, Zap } from "lucide-react";
import { Logo } from "./Logo";
import { Toasts } from "./Toasts";
import { useApp } from "@/lib/store";
import { Avatar } from "./ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/find-doctor", label: "Find Doctor", icon: Stethoscope },
  { href: "/clinics", label: "Find Clinic", icon: Building2 },
  { href: "/urgent-care", label: "Urgent Care", icon: Zap },
  { href: "/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserIcon },
];
const MOBILE = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/find-doctor", label: "Doctors", icon: Stethoscope },
  { href: "/recommendations", label: "AI Match", icon: Sparkles },
  { href: "/urgent-care", label: "Urgent", icon: Zap },
  { href: "/appointments", label: "Visits", icon: CalendarCheck },
];

export function EmergencyButton({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/emergency" className={cn("inline-flex items-center justify-center gap-2 rounded-xl bg-rescue-600 font-bold text-white shadow-sm hover:bg-rescue-700", compact ? "h-10 px-3.5 text-sm" : "h-12 px-4", className)}>
      <Siren className="h-5 w-5" aria-hidden /> Emergency Help
    </Link>
  );
}

export function Shell({ children, requireAuth }: { children: React.ReactNode; requireAuth?: boolean }) {
  const { user, unread, logout } = useApp();
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (requireAuth && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [requireAuth, user, path, router]);
  useEffect(() => setMenu(false), [path]);

  if (requireAuth && !user) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Taking you to log in...</div>;
  const active = (h: string) => path === h || (h !== "/dashboard" && path.startsWith(h));

  return (
    <div className="min-h-screen lg:pl-64">
      <Toasts />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-brand-100 bg-white px-4 py-5 lg:flex">
        <Logo href={user ? "/dashboard" : "/"} className="px-2" />
        <nav className="mt-8 flex-1 space-y-1" aria-label="Main">
          {NAV.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors", active(href) ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700")}>
              <I className="h-5 w-5" aria-hidden /> {label}
              {href === "/notifications" && unread > 0 && <span className={cn("ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold", active(href) ? "bg-white text-brand-700" : "bg-rescue-600 text-white")}>{unread}</span>}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-brand-100 pt-4">
          <Link href="/first-aid" className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-slate-600 hover:bg-brand-50"><HeartPulse className="h-5 w-5" /> First aid guide</Link>
          <EmergencyButton className="mt-2 w-full" />
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-brand-100 bg-white/90 px-4 backdrop-blur sm:px-6">
        <div className="lg:hidden"><Logo href={user ? "/dashboard" : "/"} /></div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-2 sm:gap-3">
          <EmergencyButton compact className="lg:hidden" />
          <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-rescue-600 px-1 text-[11px] font-bold text-white">{unread}</span>}
          </Link>
          {user ? (
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} aria-label="Account menu" aria-expanded={menu} className="flex items-center gap-2 rounded-full p-0.5 hover:bg-brand-50">
                <Avatar name={user.name} size={36} />
                <span className="hidden pr-2 text-sm font-semibold sm:block">{user.name.split(" ")[0]}</span>
              </button>
              {menu && (
                <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-brand-100 bg-white p-2 shadow-lift">
                  <Link href="/profile" className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-brand-50"><UserIcon className="h-4 w-4" /> Profile</Link>
                  <Link href="/first-aid" className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-brand-50"><HeartPulse className="h-4 w-4" /> First aid guide</Link>
                  <button onClick={async () => { await logout(); router.push("/"); }} className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-rescue-600 hover:bg-rescue-50"><LogOut className="h-4 w-4" /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">Log in</Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-brand-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Main">
        {MOBILE.map(({ href, label, icon: I }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", active(href) ? "text-brand-600" : "text-slate-500")}>
            <I className="h-6 w-6" aria-hidden /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
