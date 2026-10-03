"use client";
import { useState } from "react";
import { AlertTriangle, UserPlus } from "lucide-react";
import { Badge, Button, Field, Modal, inputCls } from "@/components/ui";
import { Doctor, doctorsOf } from "@/lib/data";
import { statusMeta } from "@/components/TokenTicket";
import { useStaff } from "@/lib/staff-store";
import type { Appointment, StaffState } from "@/lib/types";
import { cn, nowMin, toISO, toMin, validPhone } from "@/lib/utils";

export const ACTIVE = ["confirmed", "postponed", "now-serving"];
export const queueOf = (s: StaffState, doctorId: string, today: string) =>
  s.appointments.filter((a) => a.doctorId === doctorId && a.date === today && ACTIVE.includes(a.status)).sort((a, b) => toMin(a.time) - toMin(b.time) || a.createdAt - b.createdAt);

export function doctorStatus(s: StaffState, d: Doctor, now: Date): { key: "away" | "on" | "off"; label: string; tone: "red" | "green" | "gray" } {
  if (s.doctors.find((x) => x.id === d.id)?.away) return { key: "away", label: "Called away", tone: "red" };
  const nm = nowMin(now);
  return nm >= d.shift[0] && nm < d.shift[1] ? { key: "on", label: "On duty", tone: "green" } : { key: "off", label: "Off duty", tone: "gray" };
}
export const StatusBadge = ({ status }: { status: Appointment["status"] }) => <Badge tone={statusMeta[status].tone}>{status === "now-serving" ? "With doctor" : statusMeta[status].label}</Badge>;

export function AwayModal({ doctor, onClose }: { doctor: Doctor | null; onClose: () => void }) {
  const { state, now, act, toast } = useStaff();
  const [mode, setMode] = useState<"postpone" | "colleague">("postpone");
  const [eta, setEta] = useState(90);
  const [reason, setReason] = useState("Emergency case");
  const [busy, setBusy] = useState(false);
  if (!doctor) return null;
  const today = toISO(now), nm = nowMin(now);
  const affected = queueOf(state, doctor.id, today).filter((a) => a.status === "confirmed" && toMin(a.time) >= nm - 15);
  const colleagues = doctorsOf(doctor.clinicId).filter((d) => d.id !== doctor.id && d.specialty === doctor.specialty && !state.doctors.find((x) => x.id === d.id)?.away);
  const go = async () => {
    setBusy(true);
    try {
      const r = await act<{ notified: number; postponed: number; moved: number }>("away", { doctorId: doctor.id, mode, etaMin: eta, reason });
      toast("success", `${doctor.name} marked as called away. ${r.notified} patient${r.notified === 1 ? "" : "s"} notified.`);
      onClose();
    } catch {} finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`${doctor.name} is called away`}>
      <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span><strong>{affected.length}</strong> patient{affected.length === 1 ? "" : "s"} with appointments later today will get an SMS and WhatsApp message right away.</span></p>
      <div className="mt-4 space-y-4">
        <Field label="Reason (shown in your activity log)">
          <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
            {["Emergency case", "Hospital call", "Ward round emergency", "Personal emergency", "Other"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">What should happen to waiting patients?</legend>
          <div className="space-y-2">
            <label className={cn("flex cursor-pointer gap-3 rounded-xl border p-3", mode === "postpone" ? "border-brand-500 bg-brand-50" : "border-brand-100")}>
              <input type="radio" name="mode" checked={mode === "postpone"} onChange={() => setMode("postpone")} className="mt-1" />
              <span><span className="block font-semibold">Postpone to the next free slot</span><span className="text-sm text-slate-600">Patients are told the new time and can accept it or choose another.</span></span>
            </label>
            <label className={cn("flex gap-3 rounded-xl border p-3", colleagues.length ? "cursor-pointer" : "cursor-not-allowed opacity-50", mode === "colleague" ? "border-brand-500 bg-brand-50" : "border-brand-100")}>
              <input type="radio" name="mode" disabled={!colleagues.length} checked={mode === "colleague"} onChange={() => setMode("colleague")} className="mt-1" />
              <span><span className="block font-semibold">Move to {colleagues.length ? colleagues.map((c) => c.name).join(" or ") : "a colleague"}</span><span className="text-sm text-slate-600">{colleagues.length ? "Same specialty, nearest free time. Anyone who can't be moved is postponed." : `No other available ${doctor.specialty} at this clinic right now.`}</span></span>
            </label>
          </div>
        </fieldset>
        {mode === "postpone" && (
          <Field label="Expected to be back in" hint="Today's postponed patients are placed after this time.">
            <select className={inputCls} value={eta} onChange={(e) => setEta(Number(e.target.value))}>{[30, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} hour${m > 60 ? "s" : ""}` : `${m} minutes`}</option>)}</select>
          </Field>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={go} disabled={busy}>{busy ? "Notifying..." : "Confirm and notify"}</Button>
      </div>
    </Modal>
  );
}

export function WalkInModal({ open, onClose, defaultDoctor }: { open: boolean; onClose: () => void; defaultDoctor?: string }) {
  const { state, now, act, toast } = useStaff();
  const docs = doctorsOf(state.user.clinicId!);
  const [f, setF] = useState({ patient: "", phone: "", reason: "", doctorId: defaultDoctor || docs[0]?.id || "", urgent: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (f.patient.trim().length < 2) return setErr("Enter the patient's name.");
    if (!validPhone(f.phone)) return setErr("Enter a 10-digit mobile number.");
    setBusy(true); setErr("");
    try {
      const r = await act<{ appointment: Appointment }>("walkin", f);
      toast("success", `Token ${r.appointment.token} issued to ${r.appointment.patient}. Message sent.`);
      setF({ ...f, patient: "", phone: "", reason: "", urgent: false });
      onClose();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Register a walk-in patient">
      <div className="space-y-4">
        <Field label="Patient name"><input className={inputCls} value={f.patient} onChange={(e) => setF({ ...f, patient: e.target.value })} autoFocus /></Field>
        <Field label="Mobile number" hint="The token and queue updates are sent here."><input className={inputCls} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98200 12345" /></Field>
        <Field label="Doctor">
          <select className={inputCls} value={f.doctorId} onChange={(e) => setF({ ...f, doctorId: e.target.value })}>
            {docs.map((d) => { const st = doctorStatus(state, d, now); return <option key={d.id} value={d.id} disabled={st.key !== "on"}>{d.name} ({d.specialty}){st.key !== "on" ? ` - ${st.label.toLowerCase()}` : ""}</option>; })}
          </select>
        </Field>
        <Field label="Reason (optional)"><input className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="e.g. fever since morning" /></Field>
        <label className="flex items-start gap-3 rounded-xl bg-rescue-50 p-3 text-sm"><input type="checkbox" className="mt-1" checked={f.urgent} onChange={(e) => setF({ ...f, urgent: e.target.checked })} /><span><strong>Urgent.</strong> Place at the front of the queue instead of the next free slot.</span></label>
        {err && <p className="text-sm font-medium text-rescue-600" role="alert">{err}</p>}
        <Button size="lg" className="w-full" onClick={submit} disabled={busy}><UserPlus className="h-4 w-4" /> {busy ? "Issuing token..." : "Issue token"}</Button>
      </div>
    </Modal>
  );
}
