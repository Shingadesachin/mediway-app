"use client";
import { Clock, MapPin, Users } from "lucide-react";
import { Appointment, useApp } from "@/lib/store";
import { getClinic, getDoctor } from "@/lib/data";
import { queueInfo } from "@/lib/engine";
import { dayLabel, fmtTime } from "@/lib/utils";
import { Badge } from "./ui";

export const statusMeta: Record<Appointment["status"], { label: string; tone: "green" | "amber" | "blue" | "red" | "gray" }> = {
  confirmed: { label: "Confirmed", tone: "green" },
  "now-serving": { label: "Your turn now", tone: "blue" },
  postponed: { label: "Postponed", tone: "amber" },
  completed: { label: "Completed", tone: "gray" },
  cancelled: { label: "Cancelled", tone: "red" },
  "no-show": { label: "Missed", tone: "red" },
};

/** The queue token ticket. The memorable object of the product. */
export function TokenTicket({ appt, actions }: { appt: Appointment; actions?: React.ReactNode }) {
  const { now, allAppointments } = useApp();
  const doc = getDoctor(appt.doctorId), clinic = getClinic(appt.clinicId);
  const q = queueInfo(appt, allAppointments);
  const st = statusMeta[appt.status];
  const live = appt.status === "confirmed" || appt.status === "postponed" || appt.status === "now-serving";
  return (
    <div className="ticket flex flex-col overflow-visible rounded-3xl bg-ink text-white shadow-lift sm:flex-row">
      <div className="flex flex-1 flex-col justify-between gap-6 p-6 sm:basis-[62%] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-brand-200">Your token</p>
            <p className="tnum font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl" aria-label={`Token ${appt.token}`}>{appt.token}</p>
          </div>
          <Badge tone={st.tone} className="!border-transparent">{st.label}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold">{doc.name}</p>
          <p className="text-sm text-brand-200">{doc.specialty} at {clinic.name}</p>
          <p className="flex items-center gap-1.5 text-sm text-brand-200"><MapPin className="h-4 w-4" aria-hidden /> {clinic.address}</p>
        </div>
      </div>
      <div className="mx-6 border-t-2 border-dashed border-white/25 sm:mx-0 sm:border-l-2 sm:border-t-0" />
      <div className="flex flex-col justify-between gap-4 p-6 sm:basis-[38%] sm:p-7">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-brand-200"><Clock className="h-4 w-4" aria-hidden /> {appt.status === "postponed" ? "New time" : "Scheduled"}</p>
          <p className="font-display text-2xl font-bold">{fmtTime(appt.time)}</p>
          <p className="text-sm text-brand-200">{dayLabel(appt.date, now)}</p>
          {appt.status === "postponed" && appt.prevTime && <p className="mt-1 text-xs text-amber-100">Was {fmtTime(appt.prevTime)}</p>}
        </div>
        {live && (
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="flex items-center gap-1.5 text-xs text-brand-200"><Users className="h-3.5 w-3.5" aria-hidden /> Ahead of you</p>
            <p className="tnum text-lg font-bold">{q.ahead} {q.ahead === 1 ? "patient" : "patients"}{q.ahead > 0 && <span className="ml-1 text-sm font-medium text-brand-200">(about {q.waitMin} min)</span>}</p>
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}
