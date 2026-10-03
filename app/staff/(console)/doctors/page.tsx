"use client";
import { useState } from "react";
import { CalendarOff, Siren, Trash2 } from "lucide-react";
import { AwayModal, doctorStatus, queueOf } from "@/components/staff/parts";
import { Avatar, Badge, Button, Card, Field, inputCls } from "@/components/ui";
import { Doctor, doctorsOf } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import { fmtMin, fmtTime, fromMin, shortDate, toISO, addDays } from "@/lib/utils";

export default function Doctors() {
  const { state, now, act, toast } = useStaff();
  const docs = doctorsOf(state.user.clinicId!);
  const today = toISO(now);
  const [away, setAway] = useState<Doctor | null>(null);
  const [b, setB] = useState({ doctorId: docs[0]?.id || "", date: today, from: "13:00", to: "14:00", reason: "Lunch break" });
  const [err, setErr] = useState("");
  const run = async (type: string, p: Record<string, unknown>, ok: string) => { try { await act(type, p); toast("success", ok); } catch {} };
  const addBlock = async () => {
    setErr("");
    if (b.to <= b.from) return setErr("The end time must be after the start time.");
    await run("block", b, "Time blocked. Patients can't book it.").catch(() => {});
  };

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold sm:text-3xl">Doctors</h1><p className="text-slate-600">Availability, emergencies and blocked time for your clinic.</p></div>
      <div className="grid gap-5 md:grid-cols-2">
        {docs.map((d) => {
          const st = doctorStatus(state, d, now), info = state.doctors.find((x) => x.id === d.id), q = queueOf(state, d.id, today);
          return (
            <Card key={d.id} className={st.key === "away" ? "border-rescue-300 p-5 ring-2 ring-rescue-100" : "p-5"}>
              <div className="flex items-start gap-4">
                <Avatar name={d.name} size={52} />
                <div className="min-w-0 flex-1"><p className="font-bold">{d.name}</p><p className="text-sm text-slate-600">{d.specialty}</p><p className="mt-1 text-xs text-slate-500">Shift {fmtMin(d.shift[0])} to {fmtMin(d.shift[1])}, about {d.avgConsult} min per patient</p></div>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                {[["In queue", q.length], ["Booked today", state.appointments.filter((a) => a.doctorId === d.id && a.date === today && a.status !== "cancelled").length], ["Fee", `₹${d.fee}`]].map(([k, v]) => <div key={String(k)} className="rounded-xl bg-slate-50 p-2"><dt className="text-xs text-slate-500">{k}</dt><dd className="font-display text-lg font-bold">{v}</dd></div>)}
              </dl>
              {st.key === "away" && info?.awaySince && <p className="mt-3 text-sm text-rescue-700">Away since {new Date(info.awaySince).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}: {info.awayReason}</p>}
              <div className="mt-4">
                {st.key === "away"
                  ? <Button variant="success" className="w-full" onClick={() => run("back", { doctorId: d.id }, `${d.name} is back on duty`)}>Mark back on duty</Button>
                  : <Button variant="danger" className="w-full" onClick={() => setAway(d)}><Siren className="h-4 w-4" /> Called away for an emergency</Button>}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarOff className="h-5 w-5 text-brand-600" /> Block time</h2>
        <p className="mb-4 text-sm text-slate-600">Hide slots from patients for a break, surgery or meeting. Existing appointments are not changed.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Doctor"><select className={inputCls} value={b.doctorId} onChange={(e) => setB({ ...b, doctorId: e.target.value })}>{docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Date"><select className={inputCls} value={b.date} onChange={(e) => setB({ ...b, date: e.target.value })}>{Array.from({ length: 14 }, (_, i) => toISO(addDays(now, i))).map((x) => <option key={x} value={x}>{x === today ? "Today" : shortDate(x)}</option>)}</select></Field>
          <Field label="From"><input type="time" step={1800} className={inputCls} value={b.from} onChange={(e) => setB({ ...b, from: e.target.value })} /></Field>
          <Field label="To"><input type="time" step={1800} className={inputCls} value={b.to} onChange={(e) => setB({ ...b, to: e.target.value })} /></Field>
          <Field label="Reason"><input className={inputCls} value={b.reason} onChange={(e) => setB({ ...b, reason: e.target.value })} /></Field>
        </div>
        {err && <p className="mt-2 text-sm font-medium text-rescue-600" role="alert">{err}</p>}
        <Button className="mt-4" onClick={addBlock}>Block this time</Button>
        {state.blocks.length > 0 && (
          <ul className="mt-5 divide-y divide-brand-100 rounded-xl border border-brand-100">
            {state.blocks.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span><strong>{docs.find((d) => d.id === x.doctorId)?.name}</strong> · {x.date === today ? "Today" : shortDate(x.date)}, {fmtTime(fromMin(x.from))} to {fmtTime(fromMin(x.to))} <span className="text-slate-500">({x.reason})</span></span>
                <button onClick={() => run("unblock", { id: x.id }, "Time unblocked")} aria-label="Remove block" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rescue-50 hover:text-rescue-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <AwayModal doctor={away} onClose={() => setAway(null)} />
    </div>
  );
}
