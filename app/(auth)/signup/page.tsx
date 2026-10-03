"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { Toasts } from "@/components/Toasts";
import { Button, Field, inputCls } from "@/components/ui";
import { useApp } from "@/lib/store";
import { validPhone } from "@/lib/utils";

export default function Signup() {
  const { signup, guest } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setErrs({ ...errs, [k]: "" }); };

  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your full name.";
    if (!validPhone(f.phone)) er.phone = "Enter a 10-digit mobile number. Your token is sent here.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email address.";
    if (f.password.length < 8) er.password = "Use at least 8 characters.";
    if (f.confirm !== f.password) er.confirm = "Passwords do not match.";
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const r = await signup({ name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), password: f.password });
    setBusy(false);
    if (!r.ok) return setErrs({ email: r.error || "Could not sign up." });
    router.push("/dashboard");
  };
  return (
    <AuthFrame title="Create your account" sub="It takes a minute. Your token and updates go to your phone.">
      <Toasts />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errs.name}><input className={inputCls} value={f.name} onChange={set("name")} autoComplete="name" /></Field>
        <Field label="Mobile number" error={errs.phone} hint="We send your token on WhatsApp and SMS."><input className={inputCls} value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="98200 12345" /></Field>
        <Field label="Email" error={errs.email}><input className={inputCls} type="email" value={f.email} onChange={set("email")} autoComplete="email" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errs.password}><input className={inputCls} type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></Field>
          <Field label="Confirm password" error={errs.confirm}><input className={inputCls} type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></Field>
        </div>
        <Button size="lg" className="w-full" disabled={busy}>{busy ? "Creating account..." : "Create account"}</Button>
      </form>
      <Button variant="secondary" size="lg" className="mt-3 w-full" onClick={async () => { const r = await guest(); if (r.ok) router.push("/dashboard"); }}>Continue as Guest</Button>
      <p className="mt-6 text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></p>
    </AuthFrame>
  );
}
