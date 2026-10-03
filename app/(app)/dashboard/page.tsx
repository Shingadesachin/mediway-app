"use client";
import Link from "next/link";
import { Bell, Building2, CalendarPlus, ChevronRight, HeartPulse, Siren, Sparkles, Stethoscope, Timer, Zap } from "lucide-react";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { TokenTicket } from "@/components/TokenTicket";
import { DoctorCard } from "@/components/DoctorCard";
import { ClinicCard } from "@/components/ClinicCard";
import { CLINICS, getClinic, getDoctor } from "@/lib/data";
import { isClinicOpen, recommend, urgentScore } from "@/lib/engine";
import { useApp } from "@/lib/store";
import { dayLabel, fmtTime, timeAgo, toISO } from "@/lib/utils";

export default function Dashboard() {
  const { user, now, ctx, appointments, notifications, waits } = useApp();
  const hr = now.getHours();
  const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const today = toISO(now);
  const upcoming = appointments.filter((a) => ["confirmed", "postponed", "now-serving"].includes(a.status) && a.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const next = upcoming[0];
  const recent = appointments.filter((a) => a.status === "completed").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 3);
  const bestUrgent = CLINICS.filter((c) => c.urgent && isClinicOpen(c, now)).sort((a, b) => urgentScore(b, waits[b.id] ?? b.baseWait) - urgentScore(a, waits[a.id] ?? a.baseWait))[0];
  const recDocs = recommend({ specialty: "", date: today, time: "", maxKm: 6, maxFee: 1500, urgent: false }, ctx, waits).slice(0, 2);
  const recClinics = [...CLINICS].sort((a, b) => b.rating - a.rating + (a.distanceKm - b.distanceKm) * 0.05).slice(0, 2);

  const quick = [
    { href: "/urgent-care", icon: Zap, label: "Urgent care now", tone: "bg-aqua-50 text-aqua-700" },
    { href: "/recommendations", icon: Sparkles, label: "AI match", tone: "bg-brand-50 text-brand-700" },
    { href: "/find-doctor", icon: Stethoscope, label: "Find a doctor", tone: "bg-brand-50 text-brand-700" },
    { href: "/clinics", icon: Building2, label: "Find a clinic", tone: "bg-brand-50 text-brand-700" },
    { href: "/first-aid", icon: HeartPulse, label: "First aid", tone: "bg-ok-50 text-ok-700" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{greet}, {user?.name.split(" ")[0]}</h1>
        <p className="mt-1 text-slate-600">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="flex flex-col items-start gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft hover:border-brand-300">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${q.tone}`}><q.icon className="h-5 w-5" aria-hidden /></span>
            <span className="font-semibold">{q.label}</span>
          </Link>
        ))}
      </div>

      <section aria-labelledby="up">
        <h2 id="up" className="mb-3 text-xl font-bold">Upcoming Appointment</h2>
        {next ? (
          <>
            {next.status === "postponed" && (
              <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700" role="alert">
                <strong>Your appointment has been postponed.</strong> Your doctor was called away. Accept the new time or choose another.
                <div className="mt-3 flex gap-2"><ButtonLink href="/appointments" size="sm" variant="dark">Review</ButtonLink><ButtonLink href={`/book?reschedule=${next.id}`} size="sm" variant="secondary">Choose another time</ButtonLink></div>
              </div>
            )}
            <TokenTicket appt={next} actions={<div className="flex gap-2"><ButtonLink href="/appointments" size="sm" variant="secondary" className="flex-1 !border-transparent">View</ButtonLink><ButtonLink href={`/book?reschedule=${next.id}`} size="sm" className="flex-1 !bg-aqua-500 hover:!bg-aqua-600">Reschedule</ButtonLink></div>} />
          </>
        ) : (
          <EmptyState icon={<CalendarPlus className="h-6 w-6" />} title="No upcoming appointments" body="Find a doctor or an urgent care clinic and get a token in a few taps." action={<ButtonLink href="/find-doctor">Find a doctor</ButtonLink>} />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {bestUrgent && (
          <Card className="p-5">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Shortest urgent care wait</h2><Badge tone="green">Live</Badge></div>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-center"><p className="tnum font-display text-5xl font-extrabold text-brand-700">{waits[bestUrgent.id] ?? bestUrgent.baseWait}</p><p className="text-xs text-slate-500">min wait</p></div>
              <div><p className="font-bold">{bestUrgent.name}</p><p className="text-sm text-slate-600">{bestUrgent.area}, {bestUrgent.distanceKm} km</p></div>
            </div>
            <div className="mt-4 flex gap-3"><ButtonLink href={`/book?clinic=${bestUrgent.id}&urgent=1`} className="flex-1"><Timer className="h-4 w-4" /> Get a token</ButtonLink><ButtonLink href="/urgent-care" variant="secondary" className="flex-1">See all</ButtonLink></div>
          </Card>
        )}
        <Card className="border-rescue-100 bg-rescue-50 p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold text-rescue-700"><Siren className="h-5 w-5" /> Emergency Help</h2>
          <p className="mt-2 text-sm text-slate-700">Chest pain, trouble breathing, heavy bleeding or unconsciousness: call <strong>108</strong> now. We can show nearby hospitals and first aid steps.</p>
          <div className="mt-4 flex gap-3"><ButtonLink href="/emergency" variant="danger" className="flex-1">Emergency Help</ButtonLink><ButtonLink href="/first-aid" variant="secondary" className="flex-1">First aid</ButtonLink></div>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">Recommended Doctors</h2><Link href="/recommendations" className="flex items-center text-sm font-semibold text-brand-600">Personalise <ChevronRight className="h-4 w-4" /></Link></div>
        <div className="grid gap-4 md:grid-cols-2">{recDocs.map((r, i) => <DoctorCard key={r.doctor.id} doctor={r.doctor} rec={r} best={i === 0} />)}</div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">Recommended Clinics</h2><Link href="/clinics" className="flex items-center text-sm font-semibold text-brand-600">See all <ChevronRight className="h-4 w-4" /></Link></div>
        <div className="grid gap-4 md:grid-cols-2">{recClinics.map((c) => <ClinicCard key={c.id} clinic={c} />)}</div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-bold">Recent Appointments</h2>
          {recent.length ? (
            <Card className="divide-y divide-brand-100">
              {recent.map((a) => { const d = getDoctor(a.doctorId); return (
                <div key={a.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-semibold">{d.name}</p><p className="text-sm text-slate-600">{d.specialty}, {dayLabel(a.date, now)} {fmtTime(a.time)}</p></div><ButtonLink size="sm" variant="secondary" href={`/book?doctor=${a.doctorId}`}>Book again</ButtonLink></div>
              ); })}
            </Card>
          ) : <EmptyState icon={<CalendarPlus className="h-6 w-6" />} title="No past visits yet" />}
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">Notifications</h2><Link href="/notifications" className="text-sm font-semibold text-brand-600">View all</Link></div>
          {notifications.length ? (
            <Card className="divide-y divide-brand-100">
              {notifications.slice(0, 3).map((n) => (
                <Link key={n.id} href="/notifications" className="flex gap-3 p-4 hover:bg-brand-50/50"><Bell className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" /><div className="min-w-0"><p className="text-sm font-semibold">{n.title}{!n.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-rescue-500" />}</p><p className="truncate text-sm text-slate-600">{n.body}</p><p className="text-xs text-slate-400">{timeAgo(n.time, now.getTime())}</p></div></Link>
              ))}
            </Card>
          ) : <EmptyState icon={<Bell className="h-6 w-6" />} title="You're all caught up" body="Confirmations and reminders will show up here." />}
        </section>
      </div>
    </div>
  );
}
