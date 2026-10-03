"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Save } from "lucide-react";
import { Avatar, Button, Card, Chip, Field, PageHeader, Toggle, inputCls } from "@/components/ui";
import { CLINICS, DOCTORS, SPECIALTIES, getClinic, getDoctor } from "@/lib/data";
import { useApp } from "@/lib/store";
import { fmtTime, shortDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function Profile() {
  const { user, updateUser, prefs, setPrefs, appointments, savedDoctors, savedClinics, toggleDoctor, toggleClinic, toast, logout } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ name: "", age: "", phone: "", email: "", location: "" });
  const [spec, setSpec] = useState<string[]>([]);
  useEffect(() => { if (user) { setF({ name: user.name, age: user.age, phone: user.phone, email: user.email, location: user.location }); setSpec(user.specialties); } }, [user]);
  if (!user) return null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const save = () => { updateUser({ ...f, specialties: spec }); toast({ type: "success", title: "Profile saved" }); };
  const history = appointments.filter((a) => a.status === "completed" || a.status === "cancelled").slice().reverse();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Profile" sub={user.guest ? "You're browsing as a guest. Sign up to keep your details." : "Your details help us suggest better care and send updates."} />
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-4"><Avatar name={user.name} size={64} /><div><p className="text-xl font-bold">{user.name}</p><p className="text-sm text-slate-600">{user.email || user.phone || "No contact added"}</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className={inputCls} value={f.name} onChange={set("name")} /></Field>
          <Field label="Age"><input className={inputCls} inputMode="numeric" value={f.age} onChange={set("age")} /></Field>
          <Field label="Phone" hint="Tokens and updates are sent here"><input className={inputCls} inputMode="tel" value={f.phone} onChange={set("phone")} /></Field>
          <Field label="Email"><input className={inputCls} type="email" value={f.email} onChange={set("email")} /></Field>
          <div className="sm:col-span-2"><Field label="Location"><input className={inputCls} value={f.location} onChange={set("location")} placeholder="Area or PIN code" /></Field></div>
        </div>
        <p className="mb-2 mt-5 text-sm font-semibold">Preferred specialties</p>
        <div className="flex flex-wrap gap-2">{SPECIALTIES.map((s) => <Chip key={s} active={spec.includes(s)} onClick={() => setSpec(spec.includes(s) ? spec.filter((x) => x !== s) : [...spec, s])}>{s}</Chip>)}</div>
        <Button className="mt-6" onClick={save}><Save className="h-4 w-4" /> Save changes</Button>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-1 text-lg font-bold">Notification preferences</h2>
        <p className="mb-3 text-sm text-slate-600">Choose how we reach you about tokens, delays and postponements.</p>
        {([["sms", "SMS", "Token, reminders and doctor-delay alerts"], ["whatsapp", "WhatsApp", "Same updates on WhatsApp"], ["reminders", "Appointment reminders", "About an hour before your time"], ["email", "Email", "Booking receipts"]] as const).map(([k, t, d]) => (
          <div key={k} className="flex items-center justify-between gap-4 border-t border-brand-100 py-3 first:border-0">
            <div><p className="font-semibold">{t}</p><p className="text-sm text-slate-500">{d}</p></div>
            <Toggle checked={prefs[k]} onChange={(v) => setPrefs({ [k]: v })} label={t} />
          </div>
        ))}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold">Saved doctors</h2>
          {savedDoctors.length === 0 && <p className="text-sm text-slate-500">Tap the heart on a doctor to save them.</p>}
          <ul className="space-y-3">{savedDoctors.map((id) => { const d = DOCTORS.find((x) => x.id === id); if (!d) return null; return (
            <li key={id} className="flex items-center gap-3"><Avatar name={d.name} size={40} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{d.name}</p><p className="text-xs text-slate-500">{d.specialty}</p></div><Link href={`/book?doctor=${id}`} className="text-sm font-semibold text-brand-600">Book</Link><button onClick={() => toggleDoctor(id)} className="text-sm text-slate-400 hover:text-rescue-600">Remove</button></li>); })}</ul>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold">Saved clinics</h2>
          {savedClinics.length === 0 && <p className="text-sm text-slate-500">Save clinics from the clinic list.</p>}
          <ul className="space-y-3">{savedClinics.map((id) => { const c = CLINICS.find((x) => x.id === id); if (!c) return null; return (
            <li key={id} className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.name}</p><p className="text-xs text-slate-500">{c.area} · {c.distanceKm} km</p></div><button onClick={() => toggleClinic(id)} className="text-sm text-slate-400 hover:text-rescue-600">Remove</button></li>); })}</ul>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">Appointment history</h2>
        {history.length === 0 && <p className="text-sm text-slate-500">Completed visits will appear here.</p>}
        <ul className="divide-y divide-brand-100">{history.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <div><p className="font-semibold">{getDoctor(a.doctorId).name}</p><p className="text-slate-500">{getClinic(a.clinicId).name} · {a.reason}</p></div>
            <div className="text-right"><p>{shortDate(a.date)}, {fmtTime(a.time)}</p><p className="text-xs capitalize text-slate-500">{a.status}</p></div>
          </li>))}</ul>
      </Card>
      <Button variant="secondary" onClick={() => { logout(); router.push("/"); }}><LogOut className="h-4 w-4" /> Log out</Button>
    </div>
  );
}
