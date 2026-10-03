"use client";
import { CalendarPlus, CheckCircle2 } from "lucide-react";
import { Bubble } from "@/components/PhonePreview";
import { TokenTicket } from "@/components/TokenTicket";
import { Button, ButtonLink, Card, EmptyState } from "@/components/ui";
import { getClinic, getDoctor } from "@/lib/data";
import { useQuery } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { fmtTime, longDate, rupee, toMin } from "@/lib/utils";

export default function Confirmation() {
  const { appointments, messages } = useApp();
  const q = useQuery();
  if (!q) return null;
  const a = appointments.find((x) => x.id === q.get("id"));
  if (!a) return <EmptyState icon={<CalendarPlus className="h-6 w-6" />} title="We couldn't find that appointment" action={<ButtonLink href="/appointments">View appointments</ButtonLink>} />;
  const doc = getDoctor(a.doctorId), clinic = getClinic(a.clinicId);
  const msgs = messages.filter((m) => m.apptId === a.id).slice(0, 2).reverse();
  const rescheduled = q.get("rescheduled");

  const ics = () => {
    const f = (t: string, d: string) => d.replace(/-/g, "") + "T" + t.replace(":", "") + "00";
    const endMin = toMin(a.time) + 30;
    const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MediWay//EN", "BEGIN:VEVENT", `UID:${a.id}@mediway`, `DTSTART:${f(a.time, a.date)}`, `DTEND:${f(end, a.date)}`, `SUMMARY:${doc.name} (token ${a.token})`, `LOCATION:${clinic.name}\\, ${clinic.address}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    const l = document.createElement("a"); l.href = url; l.download = `mediway-${a.token}.ics`; l.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok-50 text-ok-500"><CheckCircle2 className="h-9 w-9" /></span>
        <h1 className="mt-3 text-3xl font-bold">{rescheduled ? "Appointment rescheduled!" : "Appointment Confirmed!"}</h1>
        <p className="mt-1 text-slate-600">{rescheduled ? "Your new time is saved." : "Your appointment has been successfully booked."}</p>
      </div>
      <TokenTicket appt={a} />
      <Card className="p-5">
        <h2 className="mb-3 text-lg font-bold">Details</h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {[["Doctor", doc.name], ["Clinic", clinic.name], ["Date", longDate(a.date)], ["Time", fmtTime(a.time)], ["Appointment ID", a.id.toUpperCase()], ["Consultation", rupee(doc.fee)]].map(([k, v]) => (
            <li key={k} className="flex gap-2"><span className="text-ok-500">✓</span><span className="text-slate-500">{k}:</span> <strong>{v}</strong></li>
          ))}
        </ul>
      </Card>
      {msgs.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-bold">Sent to your phone</h2>
          <p className="mb-3 text-sm text-slate-600">This is what we just sent to {a.phone || "your number"}.</p>
          <div className="space-y-3">{msgs.map((m) => <Bubble key={m.id} m={m} />)}</div>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Button variant="secondary" onClick={ics}><CalendarPlus className="h-4 w-4" /> Add to Calendar</Button>
        <ButtonLink href="/appointments" variant="secondary">View Appointment</ButtonLink>
        <ButtonLink href="/dashboard">Back to Dashboard</ButtonLink>
      </div>
    </div>
  );
}
