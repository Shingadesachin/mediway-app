"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BellRing, CalendarClock, ClipboardCheck, HeartPulse, MapPin, MessageCircle, Search, Siren, Ticket, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";
import { WaitBoard } from "@/components/WaitBoard";
import { Toasts } from "@/components/Toasts";
import { Button, ButtonLink, Card, Chip, Disclaimer, inputCls, Segmented } from "@/components/ui";
import { SPECIALTIES } from "@/lib/data";
import { useApp } from "@/lib/store";

type Mode = "specialty" | "doctor" | "clinic" | "nearby";

export default function Landing() {
  const { user } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("specialty");
  const [spec, setSpec] = useState("");
  const [text, setText] = useState("");
  const [loc, setLoc] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const l = encodeURIComponent(loc);
    if (mode === "specialty") router.push(`/recommendations?specialty=${encodeURIComponent(spec)}&loc=${l}&run=1`);
    if (mode === "doctor") router.push(`/find-doctor?q=${encodeURIComponent(text)}`);
    if (mode === "clinic") router.push(`/clinics?q=${encodeURIComponent(text)}&loc=${l}`);
    if (mode === "nearby") router.push(`/urgent-care?loc=${l}`);
  };

  return (
    <div className="min-h-screen">
      <Toasts />
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/staff/login" className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-brand-50 md:inline-flex">For clinics</Link>
          <Link href="/emergency" className="inline-flex h-10 items-center gap-2 rounded-xl bg-rescue-600 px-3.5 text-sm font-bold text-white hover:bg-rescue-700"><Siren className="h-4 w-4" /> <span className="hidden sm:inline">Emergency Help</span><span className="sm:hidden">SOS</span></Link>
          {user ? (
            <ButtonLink href="/dashboard" size="sm">Open dashboard</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">Log in</ButtonLink>
              <ButtonLink href="/signup" size="sm" className="hidden sm:inline-flex">Sign up</ButtonLink>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-12 lg:pt-10">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">Find the Right Care, Right When You Need It.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">AI-powered recommendations to help you find suitable doctors and clinics near you. Check live doctor availability, get a token, and skip the front desk.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/find-doctor" size="lg">Find a Doctor</ButtonLink>
            <ButtonLink href="/clinics" size="lg" variant="secondary">Find a Clinic</ButtonLink>
            <ButtonLink href="/emergency" size="lg" variant="danger"><Siren className="h-5 w-5" /> Emergency Help</ButtonLink>
          </div>

          <Card className="mt-8 p-5 sm:p-6">
            <h2 className="text-xl font-bold">What kind of care are you looking for?</h2>
            <div className="mt-4 overflow-x-auto no-scrollbar">
              <Segmented<Mode> value={mode} onChange={setMode} options={[{ value: "specialty", label: "Specialty" }, { value: "doctor", label: "Doctor" }, { value: "clinic", label: "Clinic" }, { value: "nearby", label: "Nearby" }]} />
            </div>
            <form onSubmit={go} className="mt-4 space-y-4">
              {mode === "specialty" && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Specialties">
                  {SPECIALTIES.map((s) => <Chip key={s} active={spec === s} onClick={() => setSpec(spec === s ? "" : s)}>{s}</Chip>)}
                </div>
              )}
              {(mode === "doctor" || mode === "clinic") && <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "doctor" ? "Doctor name or specialty" : "Clinic name or area"} aria-label={mode === "doctor" ? "Search doctors" : "Search clinics"} />}
              {mode === "nearby" && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">We'll show urgent care clinics around you, ranked by current wait time.</p>}
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-brand-500" aria-hidden />
                <input className={inputCls + " pl-12"} value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Enter your location" aria-label="Your location" />
              </div>
              <Button size="lg" className="w-full sm:w-auto"><Search className="h-5 w-5" /> Get Recommendations</Button>
            </form>
          </Card>
        </div>
        <WaitBoard />
      </section>

      <section className="border-y border-brand-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-bold">A front desk that never closes</h2>
          <p className="mt-2 max-w-2xl text-slate-600">MediWay does what a receptionist does: checks who is free, gives you a place in line, and keeps you updated.</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { n: 1, icon: Search, t: "Tell us what you need", b: "Describe your problem or pick a specialty. We suggest who to see. We never diagnose." },
              { n: 2, icon: CalendarClock, t: "See who is free right now", b: "Live doctor availability and wait times at nearby clinics, best rated first." },
              { n: 3, icon: Ticket, t: "Get your token", b: "Book in a few taps. Your token and queue updates arrive by WhatsApp and SMS." },
            ].map((s) => (
              <li key={s.n} className="rounded-2xl bg-mist p-5">
                <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-display font-bold text-white">{s.n}</span><s.icon className="h-5 w-5 text-brand-500" aria-hidden /></div>
                <h3 className="text-lg font-bold">{s.t}</h3><p className="mt-1 text-sm text-slate-600">{s.b}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, t: "Urgent care by wait time", b: "Best-rated urgent care ranked by how long you'd wait today." },
              { icon: MessageCircle, t: "WhatsApp and SMS", b: "Token, reminders, and changes sent automatically." },
              { icon: BellRing, t: "If the doctor is called away", b: "Patients are moved to the next free slot and told right away." },
              { icon: HeartPulse, t: "No clinic nearby at night?", b: "Step-by-step first aid until the ambulance arrives." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-brand-100 p-5"><f.icon className="mb-3 h-6 w-6 text-aqua-600" aria-hidden /><h3 className="font-bold">{f.t}</h3><p className="mt-1 text-sm text-slate-600">{f.b}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl bg-rescue-50 p-7">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-rescue-700"><Siren className="h-6 w-6" /> In an emergency, do not wait</h2>
          <p className="mt-2 text-slate-700">For a serious or life-threatening condition, call <strong>108</strong> (ambulance) or <strong>112</strong> now, or go to the nearest emergency department. MediWay can show nearby hospitals and first aid steps, but it cannot diagnose an emergency.</p>
          <div className="mt-5 flex flex-wrap gap-3"><ButtonLink href="/emergency" variant="danger">Emergency Help</ButtonLink><ButtonLink href="/first-aid" variant="secondary">First aid until help arrives</ButtonLink></div>
        </div>
        <div className="rounded-3xl bg-white p-7 border border-brand-100">
          <h2 className="flex items-center gap-2 text-xl font-bold"><ClipboardCheck className="h-5 w-5 text-brand-600" /> Run a clinic?</h2>
          <p className="mt-2 text-sm text-slate-600">The clinic desk is a separate app for your reception team: live queue, walk-in registration, analytics, and automatic messages when a doctor is called away.</p>
          <ButtonLink href="/staff/login" variant="secondary" className="mt-4">Clinic staff login</ButtonLink>
        </div>
      </section>

      <footer className="border-t border-brand-100 bg-white">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
          <Disclaimer />
          <p className="text-sm text-slate-500">MediWay. Smart Care. Less Waiting. Clinic, doctor and hospital data in this prototype is sample data.</p>
        </div>
      </footer>
    </div>
  );
}
