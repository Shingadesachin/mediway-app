"use client";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Download, Search, UserPlus, XCircle } from "lucide-react";
import { StatusBadge, WalkInModal } from "@/components/staff/parts";
import { Badge, Button, Card, EmptyState, Modal, inputCls } from "@/components/ui";
import { doctorsOf, getDoctor } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import type { Appointment } from "@/lib/types";
import { addDays, cn, dayLabel, fmtTime, shortDate, toISO } from "@/lib/utils";

type Range = "today" | "tomorrow" | "week" | "past" | "all";

function RescheduleModal({ appt, onClose }: { appt: Appointment | null; onClose: () => void }) {
  const { now, act, toast } = useStaff();
  const [date, setDate] = useState(toISO(now));
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!appt) return;
    setSlots(null); setTime("");
    fetch(`/api/staff/slots?doctorId=${appt.doctorId}&date=${date}&ignore=${appt.id}`).then((r) => r.json()).then((j) => setSlots(j.slots || [])).catch(() => setSlots([]));
  }, [appt, date]);
  if (!appt) return null;
  const go = async () => { setBusy(true); try { await act("reschedule", { id: appt.id, date, time }); toast("success", `${appt.token} moved. ${appt.patient} has been notified.`); onClose(); } catch {} finally { setBusy(false); } };
  return (
    <Modal open onClose={onClose} title={`Reschedule ${appt.token}`}>
      <p className="mb-3 text-sm text-slate-600">{appt.patient} with {getDoctor(appt.doctorId).name}. Currently {dayLabel(appt.date, now)} at {fmtTime(appt.time)}.</p>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {Array.from({ length: 14 }, (_, i) => toISO(addDays(now, i))).map((d) => <button key={d} onClick={() => setDate(d)} aria-pressed={d === date} className={cn("shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold", d === date ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 hover:bg-brand-50")}>{d === toISO(now) ? "Today" : shortDate(d)}</button>)}
      </div>
      {slots === null ? <p className="py-6 text-center text-sm text-slate-500">Loading free times...</p> : slots.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No free times on this date.</p> : (
        <div className="mt-2 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">{slots.map((t) => <button key={t} onClick={() => setTime(t)} aria-pressed={t === time} className={cn("h-11 rounded-xl border text-sm font-semibold", t === time ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 hover:bg-brand-50")}>{fmtTime(t)}</button>)}</div>
      )}
      <Button className="mt-5 w-full" size="lg" disabled={!time || busy} onClick={go}>{busy ? "Saving..." : "Move and notify patient"}</Button>
    </Modal>
  );
}

export default function Appointments() {
  const { state, now, act, toast } = useStaff();
  const docs = doctorsOf(state.user.clinicId!);
  const today = toISO(now);
  const [range, setRange] = useState<Range>("today");
  const [doc, setDoc] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [walk, setWalk] = useState(false);
  const [resched, setResched] = useState<Appointment | null>(null);
  const [cancel, setCancel] = useState<Appointment | null>(null);

  const rows = useMemo(() => {
    const tom = toISO(addDays(now, 1)), wk = toISO(addDays(now, 7)), term = q.trim().toLowerCase();
    return state.appointments.filter((a) => {
      if (range === "today" && a.date !== today) return false;
      if (range === "tomorrow" && a.date !== tom) return false;
      if (range === "week" && (a.date < today || a.date > wk)) return false;
      if (range === "past" && a.date >= today) return false;
      if (doc && a.doctorId !== doc) return false;
      if (status && a.status !== status) return false;
      if (term && !`${a.patient} ${a.phone} ${a.token} ${a.reason}`.toLowerCase().includes(term)) return false;
      return true;
    }).sort((a, b) => (range === "past" ? (b.date + b.time).localeCompare(a.date + a.time) : (a.date + a.time).localeCompare(b.date + b.time)));
  }, [state.appointments, range, doc, status, q, today, now]);

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = ["Token,Patient,Phone,Doctor,Date,Time,Reason,Source,Status", ...rows.map((a) => [a.token, a.patient, a.phone, getDoctor(a.doctorId).name, a.date, a.time, a.reason, a.source, a.status].map(esc).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const l = document.createElement("a"); l.href = url; l.download = `appointments-${today}.csv`; l.click(); URL.revokeObjectURL(url);
  };
  const doCancel = async () => { if (!cancel) return; try { await act("cancel", { id: cancel.id }); toast("success", `${cancel.token} cancelled. ${cancel.patient} has been notified.`); } catch {} setCancel(null); };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold sm:text-3xl">Appointments</h1><p className="text-slate-600">Search, reschedule and cancel on a patient's behalf. Every change sends them a message.</p></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> CSV</Button><Button onClick={() => setWalk(true)} disabled={!state.settings.walkins}><UserPlus className="h-4 w-4" /> Walk-in</Button></div>
      </div>
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="relative"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden /><input className={cn(inputCls, "pl-10")} placeholder="Search name, phone, token" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" /></div>
        <select className={inputCls} value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Date range"><option value="today">Today</option><option value="tomorrow">Tomorrow</option><option value="week">Next 7 days</option><option value="past">Past 7 days</option><option value="all">All</option></select>
        <select className={inputCls} value={doc} onChange={(e) => setDoc(e.target.value)} aria-label="Doctor"><option value="">All doctors</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">Any status</option>{["confirmed", "now-serving", "postponed", "completed", "cancelled", "no-show"].map((s) => <option key={s} value={s}>{s.replace("-", " ")}</option>)}</select>
      </Card>

      {rows.length === 0 ? <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No appointments match" body="Try a different date range or clear the filters." /> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Token", "Patient", "Doctor", "When", "Reason", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-brand-100">
                {rows.slice(0, 300).map((a) => {
                  const live = ["confirmed", "postponed"].includes(a.status);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="tnum px-4 py-3 font-display font-bold text-brand-700">{a.token}</td>
                      <td className="px-4 py-3"><p className="font-semibold">{a.patient}</p><p className="text-xs text-slate-500">{a.phone}</p></td>
                      <td className="px-4 py-3">{getDoctor(a.doctorId).name}</td>
                      <td className="tnum whitespace-nowrap px-4 py-3">{dayLabel(a.date, now)}, <strong>{fmtTime(a.time)}</strong>{a.prevTime && a.status === "postponed" && <span className="block text-xs text-amber-700">was {fmtTime(a.prevTime)}</span>}</td>
                      <td className="px-4 py-3"><span className="capitalize">{a.reason}</span> <span className="ml-1 inline-flex gap-1">{a.urgent && <Badge tone="red">Urgent</Badge>}{a.source === "walk-in" && <Badge tone="gray">Walk-in</Badge>}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-right">{live && <span className="inline-flex gap-1"><Button size="sm" variant="secondary" onClick={() => setResched(a)}>Reschedule</Button><Button size="sm" variant="ghost" className="!text-rescue-600 hover:!bg-rescue-50" onClick={() => setCancel(a)} aria-label={`Cancel ${a.token}`}><XCircle className="h-4 w-4" /></Button></span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-brand-100 px-4 py-2.5 text-xs text-slate-500">{rows.length} appointment{rows.length === 1 ? "" : "s"}{rows.length > 300 ? ", showing the first 300" : ""}</p>
        </Card>
      )}
      <WalkInModal open={walk} onClose={() => setWalk(false)} />
      <RescheduleModal appt={resched} onClose={() => setResched(null)} />
      <Modal open={!!cancel} onClose={() => setCancel(null)} title="Cancel this appointment?">
        {cancel && <><p className="text-slate-700">{cancel.patient}'s token {cancel.token} at {fmtTime(cancel.time)} will be cancelled and they will be told by SMS.</p><div className="mt-5 grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setCancel(null)}>Keep it</Button><Button variant="danger" onClick={doCancel}>Yes, cancel</Button></div></>}
      </Modal>
    </div>
  );
}
