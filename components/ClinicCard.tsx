"use client";
import { Clock, Heart, MapPin, Navigation, Timer } from "lucide-react";
import { Clinic, clinicSpecialties, doctorsOf } from "@/lib/data";
import { freeSlots, hoursLabel, isClinicOpen, nextFree } from "@/lib/engine";
import { useApp } from "@/lib/store";
import { cn, dayLabel, fmtTime, mapsDirections, toISO } from "@/lib/utils";
import { Badge, ButtonLink, Card, Rating } from "./ui";

export function ClinicCard({ clinic, highlight, onHover, badge }: { clinic: Clinic; highlight?: boolean; onHover?: () => void; badge?: string }) {
  const { ctx, waits, savedClinics, toggleClinic } = useApp();
  const open = isClinicOpen(clinic, ctx.now);
  const docs = doctorsOf(clinic.id);
  const today = toISO(ctx.now);
  const count = docs.reduce((n, d) => n + freeSlots(d, today, ctx).length, 0);
  const soonest = docs.map((d) => nextFree(d, ctx)).filter(Boolean).sort((a, b) => (a!.date + a!.time).localeCompare(b!.date + b!.time))[0];
  const saved = savedClinics.includes(clinic.id);
  return (
    <Card className={cn("p-5 transition-shadow", highlight && "ring-2 ring-brand-300")} onMouseEnter={onHover} onFocus={onHover}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {badge && <Badge tone="aqua">{badge}</Badge>}
            {clinic.urgent && <Badge tone="red">Urgent care</Badge>}
          </div>
          <h3 className="mt-1.5 text-lg font-bold">{clinic.name}</h3>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden /> {clinic.address}</p>
        </div>
        <button onClick={() => toggleClinic(clinic.id)} aria-label={saved ? "Remove from saved clinics" : "Save clinic"} aria-pressed={saved} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-rescue-50">
          <Heart className={cn("h-5 w-5", saved ? "fill-rescue-500 text-rescue-500" : "text-slate-400")} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <Rating value={clinic.rating} count={clinic.reviews} />
        <span>{clinic.distanceKm} km away</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-brand-500" aria-hidden /> {hoursLabel(clinic)}</span>
        <Badge tone={open ? "green" : "gray"}>{open ? "Open now" : "Closed now"}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{clinicSpecialties(clinic.id).map((s) => <Badge key={s} tone="blue">{s}</Badge>)}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm">
        {clinic.urgent && open && <span className="flex items-center gap-1.5 font-semibold text-brand-800"><Timer className="h-4 w-4" aria-hidden /> About {waits[clinic.id] ?? clinic.baseWait} min wait</span>}
        <span className="text-slate-700">{count > 0 ? `${count} slots left today` : soonest ? `Next: ${dayLabel(soonest.date, ctx.now)} ${fmtTime(soonest.time)}` : "No slots this week"}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ButtonLink variant="secondary" href={mapsDirections(`${clinic.name}, ${clinic.address}`)} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" /> Directions</ButtonLink>
        <ButtonLink href={`/book?clinic=${clinic.id}${clinic.urgent && open ? "&urgent=1" : ""}`}>Book Appointment</ButtonLink>
      </div>
    </Card>
  );
}
