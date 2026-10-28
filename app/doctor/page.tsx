"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import type { Appointment } from "@/lib/types";
import type { Doctor } from "@/lib/data";
import { PushNotifications } from "@/components/PushNotifications";

type DoctorState = { doctor: Doctor; appointments: Appointment[] };

export default function DoctorPortal() {
  const router = useRouter();
  const [state, setState] = useState<DoctorState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/doctor/state", { cache: "no-store" });
    if (response.status === 401 || response.status === 403) { router.replace("/doctor/login"); return; }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load your queue.");
    setState(result);
  }, [router]);
  useEffect(() => {
    void refresh().catch((e) => setError((e as Error).message));
    const timer = setInterval(() => { if (!document.hidden) void refresh().catch((e) => setError((e as Error).message)); }, 3000);
    return () => clearInterval(timer);
  }, [refresh]);
  const act = async (type: string, id?: string) => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/doctor/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update the queue.");
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  if (!state) return <main className="mx-auto max-w-4xl p-6">{error || "Loading your queue..."}</main>;
  const current = state.appointments.find((appointment) => appointment.status === "now-serving");
  const waiting = state.appointments.filter((appointment) => appointment.status !== "now-serving");
  return <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">{state.doctor.name}</h1><p className="text-slate-600">{state.doctor.specialty} · Today&apos;s queue</p></div><PushNotifications compact /></header>
    {error && <p className="rounded-xl bg-rescue-50 p-3 text-sm text-rescue-700" role="alert">{error}</p>}
    <Card className="space-y-3 p-5">
      <h2 className="text-xl font-bold">Current patient</h2>
      {current ? <div className="rounded-xl bg-brand-50 p-4"><p className="text-2xl font-bold">{current.token}</p><p>{current.patient}</p><p className="text-sm text-slate-600">{current.time} · {current.reason}</p>
        <div className="mt-4 flex gap-2"><Button disabled={busy} onClick={() => act("complete", current.id)}>Done</Button><Button variant="danger" disabled={busy} onClick={() => act("no-show", current.id)}>Missed</Button></div></div>
        : <p className="text-slate-600">No patient is currently being seen.</p>}
      <Button disabled={busy || waiting.length === 0} onClick={() => act("next")}>Call next patient</Button>
    </Card>
    <Card className="p-5">
      <h2 className="mb-3 text-xl font-bold">Next patients</h2>
      {waiting.length ? <ol className="divide-y divide-brand-100">{waiting.map((patient) => <li key={patient.id} className="flex items-center justify-between py-3"><span><strong>{patient.token}</strong> · {patient.patient}</span><span className="text-sm text-slate-500">{patient.time}</span></li>)}</ol> : <p className="text-slate-600">The queue is empty.</p>}
    </Card>
  </main>;
}
