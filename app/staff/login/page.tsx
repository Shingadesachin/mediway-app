"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Button, Field, inputCls } from "@/components/ui";

const DEMOS = [
  { email: "desk@mediway.app", label: "Sunrise Family & Urgent Care" },
  { email: "heart@mediway.app", label: "HeartFirst Cardiac Clinic" },
  { email: "night@mediway.app", label: "Medico 24x7 Urgent Care" },
];

export default function StaffLogin() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !pw) return setErr("Enter your work email and password.");
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: id, password: pw, portal: "staff" }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not log in.");
      router.replace("/staff");
    } catch (e2) { setErr((e2 as Error).message); setBusy(false); }
  };

  return (
    <div className="grid min-h-screen bg-ink lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-aqua-600/25 blur-3xl" />
        <span className="relative flex items-center gap-2.5"><LogoMark size={40} /><span className="font-display text-2xl font-extrabold">MediWay <span className="text-sm font-semibold text-aqua-200">for Clinics</span></span></span>
        <div className="relative max-w-md">
          <p className="font-display text-4xl font-extrabold leading-tight">Your front desk, running itself.</p>
          <ul className="mt-5 space-y-2 text-brand-100">
            <li>Live queue with automatic WhatsApp and SMS updates</li>
            <li>One click when a doctor is called away</li>
            <li>Walk-in tokens and wait-time analytics</li>
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">Staff access only. Actions are recorded in the clinic activity log.</p>
      </div>
      <div className="flex items-center justify-center bg-mist px-5 py-10 lg:rounded-l-[2rem]">
        <div className="w-full max-w-md">
          <span className="mb-6 flex items-center gap-2.5 lg:hidden"><LogoMark /><span className="font-display text-xl font-extrabold">MediWay <span className="text-xs font-semibold text-aqua-700">for Clinics</span></span></span>
          <h1 className="flex items-center gap-2 text-3xl font-bold"><ShieldCheck className="h-7 w-7 text-brand-600" /> Clinic login</h1>
          <p className="mt-1 text-slate-600">Sign in with your clinic work account.</p>
          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Field label="Work email"><input className={inputCls} value={id} onChange={(e) => { setId(e.target.value); setErr(""); }} autoComplete="username" placeholder="you@yourclinic.com" /></Field>
            <Field label="Password" error={err}><input className={inputCls} type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} autoComplete="current-password" /></Field>
            <Button size="lg" className="w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
          </form>
          <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-4 text-sm">
            <p className="font-semibold">Demo clinics (password <code className="rounded bg-brand-50 px-1">desk1234</code>)</p>
            <ul className="mt-2 space-y-1">
              {DEMOS.map((d) => <li key={d.email}><button type="button" onClick={() => { setId(d.email); setPw("desk1234"); setErr(""); }} className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-brand-50"><strong>{d.email}</strong><span className="block text-xs text-slate-500">{d.label}</span></button></li>)}
            </ul>
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">Looking for care? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Open the patient app</Link></p>
        </div>
      </div>
    </div>
  );
}
