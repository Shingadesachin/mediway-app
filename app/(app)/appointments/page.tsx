"use client";
import { useState } from "react";
import { CalendarX, Eye } from "lucide-react";
import { TokenTicket } from "@/components/TokenTicket";
import { Badge, Button, ButtonLink, Card, EmptyState, Modal, PageHeader, Segmented } from "@/components/ui";
import { statusMeta } from "@/components/TokenTicket";
import { getClinic, getDoctor } from "@/lib/data";
import { Appointment, useApp } from "@/lib/store";
import { dayLabel, fmtTime } from "@/lib/utils";

type Tab = "upcoming" | "past" | "cancelled";

export default function Appointments() {
  const { appointments, now, cancel, acceptShift } = useApp();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [view, setView] = useState<Appointment | null>(null);
  const [confirm, setConfirm] = useState<Appointment | null>(null);

  const sortFn = (a: Appointment, b: Appointment) => (a.date + a.time).localeCompare(b.date + b.time);
  const list = {
    upcoming: appointments.filter((a) => ["confirmed", "postponed", "now-serving"].includes(a.status)).sort(sortFn),
    past: appointments.filter((a) => a.status === "completed" || a.status === "no-show").sort((a, b) => sortFn(b, a)),
    cancelled: appointments.filter((a) => a.status === "cancelled").sort((a, b) => sortFn(b, a)),
  }[tab];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Appointments" sub="Your tokens, times and status in one place." right={<ButtonLink href="/find-doctor" size="sm">Book new</ButtonLink>} />
      <Segmented<Tab> value={tab} onChange={setTab} options={[
        { value: "upcoming", label: `Upcoming (${appointments.filter((a) => ["confirmed", "postponed", "now-serving"].includes(a.status)).length})` },
        { value: "past", label: "Past" },
        { value: "cancelled", label: "Cancelled" },
      ]} />

      <div className="mt-5 space-y-4">
        {list.length === 0 && (
          <EmptyState icon={<CalendarX className="h-6 w-6" />} title={tab === "upcoming" ? "No upcoming appointments" : `No ${tab} appointments`} body="Find a doctor and book a time in under a minute." action={<ButtonLink href="/find-doctor">Find a Doctor</ButtonLink>} />
        )}
        {list.map((a) => {
          const doc = getDoctor(a.doctorId), clinic = getClinic(a.clinicId);
          const st = statusMeta[a.status];
          const postponed = a.status === "postponed";
          return (
            <Card key={a.id} className={postponed ? "border-amber-300 p-5 ring-2 ring-amber-100" : "p-5"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><span className="tnum font-display text-xl font-extrabold text-brand-700">{a.token}</span><Badge tone={st.tone}>{st.label}</Badge>{a.urgent && <Badge tone="red">Urgent</Badge>}</div>
                  <p className="mt-1 font-bold">{doc.name} <span className="font-medium text-slate-500">· {doc.specialty}</span></p>
                  <p className="text-sm text-slate-600">{clinic.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold">{fmtTime(a.time)}</p>
                  <p className="text-sm text-slate-600">{dayLabel(a.date, now)}</p>
                  {postponed && a.prevTime && <p className="text-xs text-amber-700">Was {fmtTime(a.prevTime)}</p>}
                </div>
              </div>

              {postponed && (
                <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Your appointment has been postponed.</p>
                  <p className="mt-0.5">{doc.name} was called away for an emergency. We moved you to the next free time. Accept it or choose another.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="success" onClick={() => acceptShift(a.id)}>Accept new time</Button>
                    <ButtonLink size="sm" variant="secondary" href={`/book?reschedule=${a.id}`}>Choose another time</ButtonLink>
                  </div>
                </div>
              )}

              {tab === "upcoming" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setView(a)}><Eye className="h-4 w-4" /> View</Button>
                  {!postponed && <ButtonLink size="sm" variant="secondary" href={`/book?reschedule=${a.id}`}>Reschedule</ButtonLink>}
                  <Button size="sm" variant="ghost" className="!text-rescue-600 hover:!bg-rescue-50" onClick={() => setConfirm(a)}>Cancel</Button>
                </div>
              )}
              {tab === "past" && <div className="mt-4"><ButtonLink size="sm" variant="secondary" href={`/book?doctor=${a.doctorId}`}>Book again</ButtonLink></div>}
            </Card>
          );
        })}
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title="Appointment token" wide>
        {view && <TokenTicket appt={view} />}
      </Modal>
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Cancel this appointment?">
        {confirm && (
          <>
            <p className="text-slate-700">Token {confirm.token} with {getDoctor(confirm.doctorId).name} at {fmtTime(confirm.time)} will be cancelled and the slot released.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setConfirm(null)}>Keep it</Button>
              <Button variant="danger" onClick={() => { cancel(confirm.id); setConfirm(null); }}>Yes, cancel</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
