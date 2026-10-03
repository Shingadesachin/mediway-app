"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CalendarCheck, Clock, MessageSquareText, Stethoscope, TrendingDown, TrendingUp, UserPlus, UserX, Users } from "lucide-react";
import { Badge, Card, Segmented, Skeleton } from "@/components/ui";
import { WalkInModal } from "@/components/staff/parts";
import { getClinic } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import type { Analytics } from "@/lib/types";
import { Button } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

const C = { brand: "#0F52A8", aqua: "#0FA3B1", ok: "#1E9E6A", red: "#D62839", amber: "#E08A00", grid: "#E2E8F0" };

function Kpi({ icon: I, label, value, sub, tone = "brand", delta, goodWhenDown }: { icon: typeof Users; label: string; value: string | number; sub?: string; tone?: "brand" | "ok" | "red" | "aqua"; delta?: number; goodWhenDown?: boolean }) {
  const bg = { brand: "bg-brand-50 text-brand-600", ok: "bg-ok-50 text-ok-600", red: "bg-rescue-50 text-rescue-600", aqua: "bg-aqua-50 text-aqua-700" }[tone];
  const good = delta === undefined || delta === 0 ? null : goodWhenDown ? delta < 0 : delta > 0;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between"><span className={cn("grid h-9 w-9 place-items-center rounded-lg", bg)}><I className="h-5 w-5" aria-hidden /></span>
        {delta !== undefined && delta !== 0 && <span className={cn("flex items-center gap-0.5 text-xs font-bold", good ? "text-ok-600" : "text-rescue-600")}>{delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{Math.abs(delta)}%</span>}
      </div>
      <p className="tnum mt-3 font-display text-3xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}
const ChartCard = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
  <Card className="p-5"><h2 className="font-bold">{title}</h2>{sub && <p className="mb-3 text-xs text-slate-500">{sub}</p>}<div className={sub ? "" : "mt-3"}>{children}</div></Card>
);
const delta = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 100) : 0);
const tip = { contentStyle: { borderRadius: 12, border: "1px solid #DCE9F8", fontSize: 13 } };

export default function Overview() {
  const { state, now } = useStaff();
  const clinic = getClinic(state.user.clinicId!);
  const [days, setDays] = useState<"7" | "14" | "30">("14");
  const [data, setData] = useState<Analytics | null>(null);
  const [failed, setFailed] = useState(false);
  const [walk, setWalk] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetch(`/api/staff/analytics?days=${days}`, { cache: "no-store" }); if (!r.ok) throw new Error(); setData(await r.json()); setFailed(false); } catch { setFailed(true); }
  }, [days]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const hour = now.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const away = state.doctors.filter((d) => d.away);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-semibold text-brand-600">{clinic.name}</p><h1 className="text-2xl font-bold sm:text-3xl">{greet}, {state.user.name.split(" ")[0]}</h1></div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={days} onChange={setDays} options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }]} />
          <Button onClick={() => setWalk(true)} disabled={!state.settings.walkins}><UserPlus className="h-4 w-4" /> Walk-in</Button>
        </div>
      </div>

      {away.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rescue-200 bg-rescue-50 p-4 text-rescue-700" role="status">
          <p className="font-semibold">{away.length} doctor{away.length > 1 ? "s" : ""} currently called away. Waiting patients have been messaged.</p>
          <Link href="/staff/queue" className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold">Open queue</Link>
        </div>
      )}

      {failed && !data && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">Couldn't load analytics. <button onClick={load} className="font-bold underline">Retry</button></p>}
      {!data ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-32" />)}</div> : (
        <>
          <section aria-label="Today">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Today, live</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi icon={CalendarCheck} label="Appointments today" value={data.today.total} sub={`${data.today.walkIns} walk-in${data.today.walkIns === 1 ? "" : "s"}`} />
              <Kpi icon={Users} label="Waiting now" value={data.today.waiting} sub={`${data.today.nowServing} with a doctor, ${data.today.completed} seen`} tone="aqua" />
              <Kpi icon={Clock} label="Current wait" value={`${state.wait} min`} sub={`Avg today ${data.today.avgWait} min`} tone="aqua" />
              <Kpi icon={Stethoscope} label="Doctors on duty" value={`${data.today.onDuty}/${data.today.doctors}`} sub={away.length ? `${away.length} called away` : "All available"} tone={away.length ? "red" : "ok"} />
              <Kpi icon={UserX} label="Missed today" value={data.today.noShow} sub={`${data.today.cancelled} cancelled`} tone="red" />
              <Kpi icon={MessageSquareText} label="Messages sent today" value={data.today.messages} sub={state.twilio ? "Delivered via Twilio" : "Simulated (no Twilio keys)"} />
              <Kpi icon={Activity} label={`Appointments, ${data.days} days`} value={data.period.total} delta={delta(data.period.total, data.prev.total)} sub="vs previous period" />
              <Kpi icon={UserX} label="No-show rate" value={`${data.period.noShowRate}%`} delta={delta(data.period.noShowRate, data.prev.noShowRate)} goodWhenDown sub={`Avg wait ${data.period.avgWait} min`} tone="red" />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2" aria-label="Trends">
            <ChartCard title="Appointments per day" sub="Completed, missed and cancelled">
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.series} margin={{ left: -20, right: 4 }}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="completed" name="Completed" stackId="a" fill={C.ok} /><Bar dataKey="noShow" name="Missed" stackId="a" fill={C.red} /><Bar dataKey="cancelled" name="Cancelled" stackId="a" fill={C.amber} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </ChartCard>
            <ChartCard title="Average wait time" sub="Minutes between scheduled time and being seen">
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.series} margin={{ left: -20, right: 8 }}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11 }} unit="m" /><Tooltip {...tip} formatter={(v) => [`${v} min`, "Avg wait"]} /><Line type="monotone" dataKey="avgWait" stroke={C.brand} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
            </ChartCard>
            <ChartCard title="Busiest hours" sub={`Average patients per hour. Peak: ${data.peakHour}`}>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.byHour} margin={{ left: -20, right: 8 }}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.aqua} stopOpacity={0.5} /><stop offset="95%" stopColor={C.aqua} stopOpacity={0.03} /></linearGradient></defs><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="hour" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip {...tip} formatter={(v) => [String(v), "Patients/hr"]} /><Area type="monotone" dataKey="count" stroke={C.aqua} strokeWidth={2.5} fill="url(#g)" /></AreaChart></ResponsiveContainer></div>
            </ChartCard>
            <ChartCard title="Top reasons for visit">
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.reasons} layout="vertical" margin={{ left: 10, right: 12 }}><CartesianGrid stroke={C.grid} horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} /><YAxis type="category" dataKey="reason" width={110} tick={{ fontSize: 11 }} /><Tooltip {...tip} /><Bar dataKey="count" name="Visits" radius={[0, 6, 6, 0]}>{data.reasons.map((_, i) => <Cell key={i} fill={i === 0 ? C.brand : "#85B2E6"} />)}</Bar></BarChart></ResponsiveContainer></div>
            </ChartCard>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-brand-100 px-5 py-3"><h2 className="font-bold">Doctor performance</h2><p className="text-xs text-slate-500">Last {data.days} days</p></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Doctor", "Patients", "Seen", "Missed", "Avg wait", "Schedule filled"].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-brand-100">{data.byDoctor.map((d) => (
                  <tr key={d.id}><td className="px-4 py-3"><p className="font-semibold">{d.name}</p><p className="text-xs text-slate-500">{d.specialty}</p></td><td className="tnum px-4 py-3">{d.total}</td><td className="tnum px-4 py-3">{d.completed}</td><td className="tnum px-4 py-3">{d.noShow}</td><td className="tnum px-4 py-3">{d.avgWait} min</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${d.fill}%` }} /></div><span className="tnum text-xs font-semibold">{d.fill}%</span></div></td></tr>
                ))}</tbody></table></div>
              <div className="flex flex-wrap gap-2 border-t border-brand-100 px-5 py-3 text-sm"><Badge tone="blue">{data.period.online} booked online</Badge><Badge tone="gray">{data.period.walkIns} walk-ins</Badge><Badge tone="green">{data.period.completionRate}% completed</Badge></div>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Recent activity</h2>
              {state.audit.length === 0 ? <p className="mt-3 text-sm text-slate-500">Actions by your team show up here.</p> : (
                <ul className="mt-3 space-y-3">{state.audit.slice(0, 7).map((a) => <li key={a.id} className="text-sm"><p className="text-slate-700"><strong>{a.staffName}</strong> {a.detail}</p><p className="text-xs text-slate-500">{timeAgo(a.time, Date.now())}</p></li>)}</ul>
              )}
              <Link href="/staff/settings" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">See full log</Link>
            </Card>
          </section>
        </>
      )}
      <WalkInModal open={walk} onClose={() => setWalk(false)} />
    </div>
  );
}
