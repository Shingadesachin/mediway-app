"use client";
import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Clock, Heart, IndianRupee, Languages, MapPin, Sparkles } from "lucide-react";
import { Doctor, getClinic } from "@/lib/data";
import { Rec, doctorLive, freeSlots, nextFree } from "@/lib/engine";
import { useApp } from "@/lib/store";
import { cn, dayLabel, fmtTime, rupee, toISO } from "@/lib/utils";
import { Avatar, Badge, Button, ButtonLink, Card, Modal, Rating } from "./ui";

const liveTone = { now: "green", busy: "amber", off: "gray", emergency: "red" } as const;

export function DoctorCard({ doctor, rec, best, date, time }: { doctor: Doctor; rec?: Rec; best?: boolean; date?: string; time?: string }) {
  const { ctx, savedDoctors, toggleDoctor } = useApp();
  const [open, setOpen] = useState(false);
  const clinic = getClinic(doctor.clinicId);
  const live = doctorLive(doctor, ctx);
  const day = date ?? toISO(ctx.now);
  let slots = freeSlots(doctor, day, ctx);
  let shownDay = day;
  if (!slots.length) { const nf = nextFree(doctor, ctx); if (nf) { shownDay = nf.date; slots = freeSlots(doctor, nf.date, ctx); } }
  const saved = savedDoctors.includes(doctor.id);
  const bookHref = (t?: string) => `/book?doctor=${doctor.id}&date=${shownDay}${t ? `&time=${t}` : ""}`;

  return (
    <Card className={cn("relative flex flex-col p-5", best && "border-aqua-500 ring-2 ring-aqua-200")}>
      {(best || rec) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge tone="aqua"><Sparkles className="h-3.5 w-3.5" aria-hidden /> {best ? "Best Match" : "AI Recommended"}</Badge>
          {rec && (
            <span className="text-right leading-tight" title="A convenience ranking. It is not medical accuracy.">
              <span className="tnum font-display text-2xl font-extrabold text-aqua-700">{rec.score}% Match</span>
              <span className="block text-[11px] text-slate-500">AI Match Score</span>
            </span>
          )}
        </div>
      )}
      <div className="flex items-start gap-4">
        <Avatar name={doctor.name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold">{doctor.name}</h3>
              <p className="text-sm font-medium text-brand-600">{doctor.specialty}</p>
            </div>
            <button onClick={() => toggleDoctor(doctor.id)} aria-label={saved ? "Remove from saved doctors" : "Save doctor"} aria-pressed={saved} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-rescue-50">
              <Heart className={cn("h-5 w-5", saved ? "fill-rescue-500 text-rescue-500" : "text-slate-400")} />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">{clinic.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <Rating value={doctor.rating} count={doctor.reviews} />
            <span className="flex items-center gap-1"><BadgeCheck className="h-4 w-4 text-brand-500" aria-hidden /> {doctor.exp} yrs</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-brand-500" aria-hidden /> {clinic.distanceKm} km, {clinic.area}</span>
            <span className="flex items-center gap-1 font-semibold text-ink"><IndianRupee className="h-4 w-4 text-brand-500" aria-hidden />{rupee(doctor.fee).slice(1)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={liveTone[live.key]}><span className={cn("h-1.5 w-1.5 rounded-full", live.key === "now" ? "bg-ok-500" : live.key === "emergency" ? "bg-rescue-500" : live.key === "busy" ? "bg-amber-500" : "bg-slate-400")} /> {live.label}</Badge>
        {rec && <span className={cn("text-sm font-medium", rec.avail.kind === "exact" ? "text-ok-700" : rec.avail.kind === "alt" ? "text-amber-700" : "text-slate-500")}>{rec.avail.label}</span>}
      </div>

      {rec && rec.reasons.length > 0 && (
        <div className="mt-4 rounded-xl bg-aqua-50 p-3">
          <p className="mb-1 text-sm font-bold text-aqua-700">Recommended because:</p>
          <ul className="space-y-0.5 text-sm text-slate-700">{rec.reasons.map((r) => <li key={r}><span className="text-ok-600">✓</span> {r}</li>)}</ul>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Clock className="h-4 w-4 text-brand-500" aria-hidden /> {slots.length ? dayLabel(shownDay, ctx.now) : "No slots this week"}</p>
        {slots.length ? (
          <div className="flex flex-wrap gap-2">
            {slots.slice(0, 4).map((t) => (
              <Link key={t} href={bookHref(t)} className={cn("rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-brand-600 hover:text-white", t === time ? "border-brand-600 bg-brand-50 text-brand-700" : "border-brand-200 text-brand-700")}>{fmtTime(t)}</Link>
            ))}
            {slots.length > 4 && <span className="self-center text-sm text-slate-500">+{slots.length - 4} more</span>}
          </div>
        ) : <p className="text-sm text-slate-500">No appointments available. Try another doctor.</p>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setOpen(true)}>View Profile</Button>
        <ButtonLink href={bookHref()} aria-disabled={!slots.length}>Book Appointment</ButtonLink>
      </div>
      <DoctorProfile doctor={doctor} open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}

export function DoctorProfile({ doctor, open, onClose }: { doctor: Doctor; open: boolean; onClose: () => void }) {
  const { ctx } = useApp();
  const clinic = getClinic(doctor.clinicId);
  const nf = nextFree(doctor, ctx);
  return (
    <Modal open={open} onClose={onClose} title={doctor.name}>
      <div className="flex items-center gap-4">
        <Avatar name={doctor.name} size={64} />
        <div><p className="font-semibold text-brand-600">{doctor.specialty}</p><Rating value={doctor.rating} count={doctor.reviews} /></div>
      </div>
      <p className="mt-4 text-slate-700">{doctor.about}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-brand-50 p-3"><dt className="text-slate-500">Experience</dt><dd className="font-bold">{doctor.exp} years</dd></div>
        <div className="rounded-xl bg-brand-50 p-3"><dt className="text-slate-500">Consultation</dt><dd className="font-bold">{rupee(doctor.fee)}</dd></div>
        <div className="col-span-2 rounded-xl bg-brand-50 p-3"><dt className="flex items-center gap-1 text-slate-500"><Languages className="h-4 w-4" /> Languages</dt><dd className="font-bold">{doctor.languages.join(", ")}</dd></div>
        <div className="col-span-2 rounded-xl bg-brand-50 p-3"><dt className="text-slate-500">Often visited for</dt><dd className="font-bold capitalize">{doctor.treats.join(", ")}</dd></div>
        <div className="col-span-2 rounded-xl bg-brand-50 p-3"><dt className="text-slate-500">Clinic</dt><dd className="font-bold">{clinic.name}</dd><dd className="text-slate-600">{clinic.address}</dd></div>
      </dl>
      <p className="mt-4 text-sm text-slate-600">{nf ? `Next free slot: ${dayLabel(nf.date, ctx.now)} at ${fmtTime(nf.time)}` : "No free slots this week."}</p>
      <ButtonLink href={`/book?doctor=${doctor.id}`} className="mt-4 w-full">Book Appointment</ButtonLink>
    </Modal>
  );
}
