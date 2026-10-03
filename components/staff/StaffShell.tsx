"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, ExternalLink, LogOut, MessageSquareText, MonitorPlay, Settings, Stethoscope, Users } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import { getClinic } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/staff", label: "Overview", icon: BarChart3 },
  { href: "/staff/queue", label: "Live queue", icon: Users },
  { href: "/staff/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/staff/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/staff/messages", label: "Messages", icon: MessageSquareText },
  { href: "/staff/settings", label: "Settings", icon: Settings },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
  const { state, logout } = useStaff();
  const path = usePathname();
  const clinic = getClinic(state.user.clinicId!);
  const active = (h: string) => (h === "/staff" ? path === "/staff" : path.startsWith(h));
  if (path === "/staff/display") return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink px-4 py-5 text-white lg:flex">
        <Link href="/staff" className="flex items-center gap-2.5 px-2" aria-label="MediWay for Clinics">
          <LogoMark />
          <span className="leading-none"><span className="block font-display text-xl font-extrabold">MediWay</span><span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wider text-aqua-200">for Clinics</span></span>
        </Link>
        <div className="mt-6 rounded-xl bg-white/10 px-3 py-2.5"><p className="text-xs text-brand-200">Signed in at</p><p className="text-sm font-bold leading-snug">{clinic.name}</p></div>
        <nav className="mt-5 flex-1 space-y-1" aria-label="Clinic desk">
          {NAV.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors", active(href) ? "bg-white text-ink" : "text-brand-100 hover:bg-white/10")}>
              <I className="h-5 w-5" aria-hidden /> {label}
            </Link>
          ))}
          <a href="/staff/display" target="_blank" rel="noreferrer" className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-brand-100 hover:bg-white/10"><MonitorPlay className="h-5 w-5" aria-hidden /> Waiting-room screen <ExternalLink className="ml-auto h-4 w-4 opacity-60" aria-hidden /></a>
        </nav>
        <div className="border-t border-white/15 pt-4">
          <div className="flex items-center gap-3 px-1"><Avatar name={state.user.name} size={36} /><div className="min-w-0"><p className="truncate text-sm font-bold">{state.user.name}</p><p className="text-xs text-brand-200">Reception</p></div></div>
          <button onClick={logout} className="mt-3 flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-brand-100 hover:bg-white/10"><LogOut className="h-4 w-4" /> Log out</button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 bg-ink text-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="flex items-center gap-2"><LogoMark size={28} /><span className="font-display text-lg font-extrabold">MediWay <span className="text-xs font-semibold text-aqua-200">for Clinics</span></span></span>
          <button onClick={logout} aria-label="Log out" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"><LogOut className="h-5 w-5" /></button>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Clinic desk">
          {NAV.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold", active(href) ? "bg-white text-ink" : "text-brand-100")}><I className="h-4 w-4" aria-hidden /> {label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:pt-8">{children}</main>
    </div>
  );
}
