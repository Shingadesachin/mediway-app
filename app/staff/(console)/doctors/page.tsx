"use client";
import { useState } from "react";
import { CalendarOff, Siren, Trash2 } from "lucide-react";
import { AwayModal, doctorStatus, queueOf } from "@/components/staff/parts";
import { Avatar, Badge, Button, Card, Field, inputCls } from "@/components/ui";
import { Doctor, doctorsOf, SPECIALTIES } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import { fmtMin, fmtTime, fromMin, shortDate, toISO, addDays } from "@/lib/utils";

export default function Doctors() {
  const { state, now, act, toast, refresh } = useStaff();
  const docs = doctorsOf(state.user.clinicId!);
  const today = toISO(now);
  const [away, setAway] = useState<Doctor | null>(null);
  const [b, setB] = useState({ doctorId: docs[0]?.id || "", date: today, from: "13:00", to: "14:00", reason: "Lunch break" });
  const [err, setErr] = useState("");
  const [doctorError, setDoctorError] = useState("");
  const [doctorBusy, setDoctorBusy] = useState(false);
  const [editorId, setEditorId] = useState("");
  const [doctorForm, setDoctorForm] = useState({ name: "", specialty: SPECIALTIES[0], fee: "500", shiftStart: "09:00", shiftEnd: "18:00", languages: "English, Hindi", contactEmail: "" });
  const saveDoctor = async (event: React.FormEvent) => {
    event.preventDefault(); setDoctorError(""); setDoctorBusy(true);
    try {
      const response = await fetch("/api/staff/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...doctorForm, id: editorId || undefined }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save doctor details.");
      await refresh();
      toast("success", result.loginEmail ? `Doctor saved. Portal login: ${result.loginEmail}${result.emailStatus === "simulated" ? " (setup link logged by server)" : ""}` : "Doctor details saved.");
      setEditorId(""); setDoctorForm({ name: "", specialty: SPECIALTIES[0], fee: "500", shiftStart: "09:00", shiftEnd: "18:00", languages: "English, Hindi", contactEmail: "" });
    } catch (e) { setDoctorError((e as Error).message); }
    finally { setDoctorBusy(false); }
  };
  const editDoctor = (doctor: Doctor) => {
    setEditorId(doctor.id);
    setDoctorForm({ name: doctor.name, specialty: doctor.specialty, fee: String(doctor.fee), shiftStart: fromMin(doctor.shift[0]), shiftEnd: fromMin(doctor.shift[1]), languages: doctor.languages.join(", "), contactEmail: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const run = async (type: string, p: Record<string, unknown>, ok: string) => { try { await act(type, p); toast("success", ok); } catch {} };
  const addBlock = async () => {
    setErr("");
    if (b.to <= b.from) return setErr("The end time must be after the start time.");
    await run("block", b, "Time blocked. Patients can't book it.").catch(() => {});
  };

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold sm:text-3xl">Doctors</h1><p className="text-slate-600">Availability, emergencies and blocked time for your clinic.</p></div>
      <Card className="p-5">
        <h2 className="mb-1 text-lg font-bold">{editorId ? "Edit doctor" : "Add a doctor"}</h2>
        <p className="mb-4 text-sm text-slate-600">Doctor portal access is created with an issued MediWay login and one-time password setup link.</p>
        <form onSubmit={saveDoctor} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name"><input className={inputCls} value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} required /></Field>
          <Field label="Specialty"><select className={inputCls} value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}>{SPECIALTIES.map((specialty) => <option key={specialty}>{specialty}</option>)}</select></Field>
          <Field label="Consultation fee (₹)"><input className={inputCls} type="number" min="0" max="100000" value={doctorForm.fee} onChange={(e) => setDoctorForm({ ...doctorForm, fee: e.target.value })} required /></Field>
          <Field label="Languages (comma-separated)"><input className={inputCls} value={doctorForm.languages} onChange={(e) => setDoctorForm({ ...doctorForm, languages: e.target.value })} required /></Field>
          <Field label="Shift starts"><input className={inputCls} type="time" value={doctorForm.shiftStart} onChange={(e) => setDoctorForm({ ...doctorForm, shiftStart: e.target.value })} required /></Field>
          <Field label="Shift ends"><input className={inputCls} type="time" value={doctorForm.shiftEnd} onChange={(e) => setDoctorForm({ ...doctorForm, shiftEnd: e.target.value })} required /></Field>
          <Field label="Doctor email for portal setup"><input className={inputCls} type="email" value={doctorForm.contactEmail} onChange={(e) => setDoctorForm({ ...doctorForm, contactEmail: e.target.value })} /></Field>
          {doctorError && <p className="text-sm text-rescue-600 sm:col-span-2 lg:col-span-4" role="alert">{doctorError}</p>}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><Button disabled={doctorBusy}>{doctorBusy ? "Saving..." : editorId ? "Save doctor" : "Add doctor and create login"}</Button>{editorId && <Button type="button" variant="secondary" onClick={() => { setEditorId(""); setDoctorForm({ name: "", specialty: SPECIALTIES[0], fee: "500", shiftStart: "09:00", shiftEnd: "18:00", languages: "English, Hindi", contactEmail: "" }); }}>Cancel edit</Button>}</div>
        </form>
      </Card>
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
                <Button variant="secondary" className="mb-2 w-full" onClick={() => editDoctor(d)}>Edit doctor details</Button>
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
