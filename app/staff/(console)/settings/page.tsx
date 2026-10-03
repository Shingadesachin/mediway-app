"use client";
import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button, Card, Field, Toggle, inputCls } from "@/components/ui";
import { getClinic } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import { timeAgo } from "@/lib/utils";

export default function SettingsPage() {
  const { state, act, toast } = useStaff();
  const clinic = getClinic(state.user.clinicId!);
  const [f, setF] = useState(state.settings);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (!dirty) setF(state.settings); }, [state.settings, dirty]);
  const set = (p: Partial<typeof f>) => { setF({ ...f, ...p }); setDirty(true); };
  const save = async () => { try { await act("settings", { ...f }); toast("success", "Settings saved"); setDirty(false); } catch {} };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold sm:text-3xl">Settings</h1><p className="text-slate-600">{clinic.name}</p></div>
      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><p className="font-semibold">Accept walk-ins</p><p className="text-sm text-slate-500">Turn off when you cannot take unscheduled patients.</p></div><Toggle checked={f.walkins} onChange={(v) => set({ walkins: v })} label="Accept walk-ins" /></div>
        <Field label={`Extra wait added to estimates: ${f.delayMin} min`} hint="Use this when the clinic is running behind. Patients see longer wait times."><input type="range" min={0} max={90} step={5} value={f.delayMin} onChange={(e) => set({ delayMin: Number(e.target.value) })} className="w-full" /></Field>
        <Field label="Send reminders" hint="Patients get an SMS this long before their time.">
          <select className={inputCls} value={f.reminderMin} onChange={(e) => set({ reminderMin: Number(e.target.value) })}>{[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minutes before</option>)}</select>
        </Field>
        <Field label="Notice shown to patients when booking" hint={`${f.notice.length}/160. Leave empty for none.`}><input className={inputCls} maxLength={160} value={f.notice} onChange={(e) => set({ notice: e.target.value })} placeholder="e.g. X-ray unit is closed until 3 PM today." /></Field>
        <Button onClick={save} disabled={!dirty}>Save changes</Button>
      </Card>
      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="h-5 w-5 text-brand-600" /> Activity log</h2>
        <p className="mb-3 text-sm text-slate-600">Who did what at the front desk.</p>
        {state.audit.length === 0 ? <p className="text-sm text-slate-500">Nothing yet.</p> : (
          <ul className="divide-y divide-brand-100">{state.audit.map((a) => <li key={a.id} className="flex items-start justify-between gap-3 py-2.5 text-sm"><span><strong>{a.staffName}</strong> <span className="text-slate-600">{a.detail}</span></span><span className="shrink-0 text-xs text-slate-500">{timeAgo(a.time, Date.now())}</span></li>)}</ul>
        )}
      </Card>
      <p className="text-xs text-slate-500">Signed in as {state.user.name} ({state.user.email}).</p>
    </div>
  );
}
