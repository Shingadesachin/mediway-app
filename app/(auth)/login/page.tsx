"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { Toasts } from "@/components/Toasts";
import { Button, Field, inputCls } from "@/components/ui";
import { useQuery } from "@/lib/hooks";
import { useApp } from "@/lib/store";

export default function Login() {
  const { login, guest, user } = useApp();
  const router = useRouter();
  const q = useQuery();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const next = q?.get("next") || "/dashboard";
  useEffect(() => { if (user && q) router.replace(next); }, [user, q, next, router]);

  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !pw) return setErr("Enter your phone or email and your password.");
    setBusy(true);
    const r = await login(id, pw);
    setBusy(false);
    if (!r.ok) setErr(r.error || "Could not log in.");
  };
  return (
    <AuthFrame title="Welcome back" sub="Log in to book appointments and track your token.">
      <Toasts />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Phone or email"><input className={inputCls} value={id} onChange={(e) => { setId(e.target.value); setErr(""); }} autoComplete="username" placeholder="demo@mediway.app" /></Field>
        <Field label="Password" error={err}><input className={inputCls} type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} autoComplete="current-password" placeholder="demo1234" /></Field>
        <Button size="lg" className="w-full" disabled={busy}>{busy ? "Logging in..." : "Log in"}</Button>
      </form>
      <button type="button" onClick={() => { setId("demo@mediway.app"); setPw("demo1234"); setErr(""); }} className="mt-3 w-full rounded-xl bg-brand-50 px-4 py-3 text-left text-sm text-brand-800 hover:bg-brand-100">Demo account: <strong>demo@mediway.app</strong> / <strong>demo1234</strong>. Tap to fill.</button>
      <div className="my-5 flex items-center gap-3 text-sm text-slate-400"><span className="h-px flex-1 bg-brand-100" />or<span className="h-px flex-1 bg-brand-100" /></div>
      <Button variant="secondary" size="lg" className="w-full" onClick={async () => { const r = await guest(); if (r.ok) router.push(next); else setErr(r.error || "Could not continue as guest."); }}>Continue as Guest</Button>
      <p className="mt-6 text-center text-sm text-slate-600">Clinic staff? <Link href="/staff/login" className="font-semibold text-brand-600 hover:underline">Log in to the clinic desk</Link></p>
      <p className="mt-2 text-center text-sm text-slate-600">New to MediWay? <Link href="/signup" className="font-semibold text-brand-600 hover:underline">Create an account</Link></p>
    </AuthFrame>
  );
}
