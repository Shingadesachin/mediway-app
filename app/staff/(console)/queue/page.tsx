"use client";
import { useState } from "react";
import { Clock, MonitorPlay, PhoneCall, Siren, UserCheck, UserPlus, UserX } from "lucide-react";
import { AwayModal, StatusBadge, WalkInModal, doctorStatus, queueOf } from "@/components/staff/parts";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { Doctor, doctorsOf } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import { fmtTime, toISO } from "@/lib/utils";

export default function Queue() {
  const { state, now, act, toast } = useStaff();
  const [walk, setWalk] = useState(false);
  const [away, setAway] = useState<Doctor | null>(null);
  const today = toISO(now);
  const docs = doctorsOf(state.user.clinicId!);
  const run = async (type: string, p: Record<string, unknown>, ok?: string) => { try { await act(type, p); if (ok) toast("success", ok); } catch {} };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold sm:text-3xl">Live queue</h1><p className="text-slate-600">Today's patients by doctor. Calling the next patient messages them and the person after them.</p></div>
        <div className="flex gap-2">
          <a href="/staff/display" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 font-semibold text-brand-700 hover:bg-brand-50"><MonitorPlay className="h-4 w-4" /> Screen</a>
          <Button onClick={() => setWalk(true)} disabled={!state.settings.walkins}><UserPlus className="h-4 w-4" /> Walk-in</Button>
        </div>
      </div>
      {!state.settings.walkins && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Walk-ins are switched off in Settings.</p>}

      <div className="grid gap-5 xl:grid-cols-2">
        {docs.map((d) => {
          const st = doctorStatus(state, d, now), q = queueOf(state, d.id, today);
          const cur = q.find((a) => a.status === "now-serving"), waiting = q.filter((a) => a.status !== "now-serving");
          const info = state.doctors.find((x) => x.id === d.id);
          return (
            <Card key={d.id} className={st.key === "away" ? "border-rescue-300 p-5 ring-2 ring-rescue-100" : "p-5"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-lg font-bold">{d.name}</p><p className="text-sm text-slate-600">{d.specialty}</p><div className="mt-2 flex items-center gap-2"><Badge tone={st.tone}>{st.label}</Badge><span className="text-xs text-slate-500">{waiting.length} waiting</span></div></div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="dark" disabled={st.key === "away" || q.length === 0} onClick={() => run("next", { doctorId: d.id })}><UserCheck className="h-4 w-4" /> Call next</Button>
                  {st.key === "away"
                    ? <Button size="sm" variant="success" onClick={() => run("back", { doctorId: d.id }, `${d.name} is back on duty`)}>Back on duty</Button>
                    : <Button size="sm" variant="danger" onClick={() => setAway(d)}><Siren className="h-4 w-4" /> Called away</Button>}
                </div>
              </div>
              {st.key === "away" && <p className="mt-3 rounded-xl bg-rescue-50 p-3 text-sm text-rescue-700">{info?.awayReason || "Emergency"}. Patients have been notified. Mark the doctor back when they return.</p>}

              <div className="mt-4 rounded-2xl bg-ink p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Now with doctor</p>
                {cur ? (
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                    <div><p className="tnum font-display text-3xl font-extrabold">{cur.token}</p><p className="text-sm text-brand-100">{cur.patient}</p></div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" onClick={() => run("complete", { id: cur.id })}>Done</Button>
                      <Button size="sm" variant="secondary" onClick={() => run("no-show", { id: cur.id })}>Missed</Button>
                    </div>
                  </div>
                ) : <p className="mt-1 text-brand-100">No one yet. Press Call next.</p>}
              </div>

              <p className="mb-2 mt-4 text-sm font-semibold">Waiting ({waiting.length})</p>
              {waiting.length === 0 ? <p className="text-sm text-slate-500">Nobody waiting.</p> : (
                <ul className="divide-y divide-brand-100 rounded-xl border border-brand-100">
                  {waiting.map((a, i) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="tnum w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                        <span className="tnum w-16 font-display font-bold text-brand-700">{a.token}</span>
                        <span className="min-w-0"><span className="block truncate font-medium">{a.patient}</span><span className="flex items-center gap-1 text-xs text-slate-500"><PhoneCall className="h-3 w-3" aria-hidden />{a.phone}</span></span>
                      </span>
                      <span className="flex items-center gap-2">
                        {a.urgent && <Badge tone="red">Urgent</Badge>}{a.source === "walk-in" && <Badge tone="gray">Walk-in</Badge>}
                        <span className="tnum flex items-center gap-1 font-semibold"><Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden />{fmtTime(a.time)}</span>
                        <StatusBadge status={a.status} />
                        <button onClick={() => run("no-show", { id: a.id })} aria-label={`Mark ${a.token} as missed`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rescue-50 hover:text-rescue-600"><UserX className="h-4 w-4" /></button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
      {docs.length === 0 && <EmptyState icon={<UserCheck className="h-6 w-6" />} title="No doctors set up" />}
      <WalkInModal open={walk} onClose={() => setWalk(false)} />
      <AwayModal doctor={away} onClose={() => setAway(null)} />
    </div>
  );
}
