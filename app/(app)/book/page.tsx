"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarX, ChevronLeft, Zap } from "lucide-react";
import { Avatar, Badge, Button, ButtonLink, Card, EmptyState, Field, inputCls, Rating } from "@/components/ui";
import { doctorsOf, getClinic, getDoctor } from "@/lib/data";
import { freeSlots, nextFree, slotState, slotTimes } from "@/lib/engine";
import { useQuery } from "@/lib/hooks";
import { Appointment, useApp } from "@/lib/store";
import { addDays, cn, dayLabel, fmtTime, longDate, rupee, shortDate, toISO, toMin, validPhone } from "@/lib/utils";

export default function Book() {
  const { ctx, now, user, appointments, book, reschedule, emergencies, notices } = useApp();
  const [busy, setBusy] = useState(false);
  const q = useQuery();
  const router = useRouter();
  const today = toISO(now);
  const [ready, setReady] = useState(false);
  const [resched, setResched] = useState<Appointment | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [reason, setReason] = useState("");
  const [name, setName] = useState(user?.guest ? "" : user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!q || ready) return;
    setReady(true);
    const rid = q.get("reschedule");
    if (rid) {
      const a = appointments.find((x) => x.id === rid);
      if (a) { setResched(a); setDoctorId(a.doctorId); setDate(a.date < today ? today : a.date); return; }
    }
    let did = q.get("doctor") ?? "";
    const cid = q.get("clinic");
    if (!did && cid) {
      const best = doctorsOf(cid).map((d) => ({ d, nf: nextFree(d, ctx) })).filter((x) => x.nf).sort((a, b) => (a.nf!.date + a.nf!.time).localeCompare(b.nf!.date + b.nf!.time))[0];
      did = best?.d.id ?? doctorsOf(cid)[0]?.id ?? "";
    }
    if (!did) return;
    setDoctorId(did);
    const doc = getDoctor(did);
    const isUrgent = q.get("urgent") === "1";
    setUrgent(isUrgent);
    const qd = q.get("date"), qt = q.get("time");
    if (qd && qd >= today) { setDate(qd); if (qt) setTime(qt); return; }
    const nf = nextFree(doc, ctx);
    if (nf) { setDate(nf.date); if (isUrgent) setTime(nf.time); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const doc = doctorId ? getDoctor(doctorId) : null;
  const clinic = doc ? getClinic(doc.clinicId) : null;
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => toISO(addDays(now, i))), [now]);
  const slots = useMemo(() => (doc ? slotTimes(doc).map((t) => ({ t, s: slotState(doc, date, t, ctx) })).filter((x) => x.s !== "past") : []), [doc, date, ctx]);
  const freeCount = (d: string) => (doc ? freeSlots(doc, d, ctx).length : 0);
  const emergency = doc && date === today && !!emergencies[doc.id];
  const timeOk = !!doc && !!time && slotState(doc, date, time, ctx) === "free";
  const groups = [
    { label: "Night", f: (m: number) => m < 360 }, { label: "Morning", f: (m: number) => m >= 360 && m < 720 },
    { label: "Afternoon", f: (m: number) => m >= 720 && m < 1020 }, { label: "Evening", f: (m: number) => m >= 1020 },
  ];

  const confirm = async () => {
    if (!doc || !timeOk || busy) return;
    setBusy(true);
    try {
    if (resched) { await reschedule(resched.id, date, time); router.push(`/confirmation?id=${resched.id}&rescheduled=1`); return; }
    if (!validPhone(phone)) return setErr("Enter your 10-digit mobile number so we can send your token.");
    if (name.trim().length < 2) return setErr("Enter the patient's name.");
    const a = await book({ doctorId: doc.id, date, time, reason: reason.trim() || (urgent ? "Urgent visit" : "Consultation"), urgent, phone, patient: name.trim() });
    router.push(`/confirmation?id=${a.id}`);
    } catch (e) { setErr((e as Error).message); setTime(""); } finally { setBusy(false); }
  };

  if (q && !doc) return <EmptyState icon={<CalendarX className="h-6 w-6" />} title="Choose a doctor or clinic first" body="Pick who you want to see, then choose a time." action={<ButtonLink href="/find-doctor">Find a doctor</ButtonLink>} />;
  if (!doc || !clinic) return null;

  return (
    <div>
      <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600"><ChevronLeft className="h-4 w-4" /> Back</button>
      <h1 className="text-2xl font-bold sm:text-3xl">{resched ? "Choose a new time" : "Book appointment"}</h1>
      {resched && <p className="mt-1 text-slate-600">Current time: {dayLabel(resched.date, now)} at {fmtTime(resched.time)} (token {resched.token})</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-4"><Avatar name={doc.name} size={56} /><div><h2 className="text-lg font-bold">{doc.name}</h2><p className="text-sm font-medium text-brand-600">{doc.specialty}</p><p className="text-sm text-slate-600">{clinic.name}, {clinic.area}</p></div><div className="ml-auto hidden sm:block"><Rating value={doc.rating} count={doc.reviews} /></div></div>
            {!resched && doctorsOf(clinic.id).length > 1 && (
              <div className="mt-4 border-t border-brand-100 pt-4">
                <p className="mb-2 text-sm font-semibold">Other doctors at this clinic</p>
                <div className="flex flex-wrap gap-2">{doctorsOf(clinic.id).map((d) => (
                  <button key={d.id} onClick={() => { setDoctorId(d.id); setTime(""); }} aria-pressed={d.id === doc.id} className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold", d.id === doc.id ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 text-brand-700 hover:bg-brand-50")}>{d.name}</button>
                ))}</div>
              </div>
            )}
          </Card>

          {notices[clinic.id] && <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700" role="status"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> <span><strong>Notice from {clinic.name}:</strong> {notices[clinic.id]}</span></div>}

          {urgent && !resched && <div className="flex items-center gap-3 rounded-2xl bg-aqua-50 p-4 text-sm text-aqua-700"><Zap className="h-5 w-5 shrink-0" /> <span>Urgent visit: we picked the earliest free slot. You can change it below.</span></div>}

          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">Select a date</h2>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Date">
              {days.map((d) => { const n = freeCount(d); const on = d === date; return (
                <button key={d} onClick={() => { setDate(d); setTime(""); }} aria-pressed={on} className={cn("flex w-[84px] shrink-0 flex-col items-center rounded-2xl border px-2 py-3", on ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 bg-white hover:bg-brand-50")}>
                  <span className="text-xs font-semibold">{d === today ? "Today" : shortDate(d).split(" ")[0]}</span>
                  <span className="font-display text-xl font-bold">{new Date(d + "T00:00").getDate()}</span>
                  <span className={cn("text-[11px]", on ? "text-brand-100" : n ? "text-ok-600" : "text-slate-400")}>{n ? `${n} slots` : "Full"}</span>
                </button>
              ); })}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-lg font-bold">Select a time</h2>
            <p className="mb-4 text-sm text-slate-600">{longDate(date)}. Live availability for {doc.name}.</p>
            {emergency && <div className="mb-4 flex gap-3 rounded-xl bg-rescue-50 p-4 text-sm text-rescue-700" role="alert"><AlertTriangle className="h-5 w-5 shrink-0" /> {doc.name} has been called away for an emergency. Today's slots are paused. Pick another day.</div>}
            {!emergency && slots.filter((x) => x.s === "free").length === 0 ? (
              <EmptyState icon={<CalendarX className="h-6 w-6" />} title="No appointments available for this date." body="Try another day or another doctor." action={(() => { const nf = nextFree(doc, ctx); return nf ? <Button onClick={() => { setDate(nf.date); setTime(""); }}>Show next available ({dayLabel(nf.date, now)})</Button> : undefined; })()} />
            ) : (
              <div className="space-y-4">
                {groups.map((g) => { const items = slots.filter((x) => g.f(toMin(x.t))); if (!items.length) return null; return (
                  <div key={g.label}><p className="mb-2 text-sm font-semibold text-slate-500">{g.label}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{items.map(({ t, s }) => (
                      <button key={t} disabled={s !== "free"} onClick={() => setTime(t)} aria-pressed={t === time} className={cn("h-12 rounded-xl border text-sm font-semibold", t === time ? "border-brand-600 bg-brand-600 text-white" : s === "free" ? "border-brand-200 hover:bg-brand-50" : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 line-through")}>{fmtTime(t)}</button>
                    ))}</div></div>
                ); })}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="space-y-4 p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">Appointment summary</h2>
            <dl className="space-y-2 text-sm">
              {[["Doctor", doc.name], ["Clinic", clinic.name], ["Specialty", doc.specialty], ["Date", dayLabel(date, now) + ", " + longDate(date).split(",")[1]?.trim()], ["Time", time && timeOk ? fmtTime(time) : "Not selected"], ["Consultation", rupee(doc.fee)]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className={cn("text-right font-semibold", k === "Time" && !timeOk && "text-slate-400")}>{v}</dd></div>
              ))}
            </dl>
            {!resched && (
              <>
                <Field label="Patient name"><input className={inputCls} value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} autoComplete="name" /></Field>
                <Field label="Mobile number" hint="Your token and updates go to this number on WhatsApp and SMS."><input className={inputCls} value={phone} onChange={(e) => { setPhone(e.target.value); setErr(""); }} inputMode="tel" autoComplete="tel" placeholder="98200 12345" /></Field>
                <Field label="Reason for visit (optional)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. fever since 2 days" /></Field>
              </>
            )}
            {err && <p className="text-sm font-medium text-rescue-600" role="alert">{err}</p>}
            <Button size="lg" className="w-full" disabled={!timeOk || busy} onClick={confirm}>{busy ? "Booking..." : resched ? "Confirm new time" : "Confirm Appointment"}</Button>
            {!timeOk && <p className="text-center text-xs text-slate-500">Choose a time to continue.</p>}
            <Badge tone="green" className="w-full justify-center py-1.5">You'll get a token by WhatsApp and SMS</Badge>
          </Card>
        </div>
      </div>
    </div>
  );
}
