"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { PasswordInput } from "@/components/PasswordInput";
import { Button, Field, inputCls } from "@/components/ui";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: email, password, portal: "admin", keepSignedIn }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not log in.");
      router.replace("/admin");
    } catch (e) { setError((e as Error).message); setBusy(false); }
  };
  return <AuthFrame title="MediWay admin" sub="Sign in to review clinic applications.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="Admin email"><input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
      <Field label="Password" error={error}><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
      <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} className="h-4 w-4" /> Keep me signed in</label>
      <Button size="lg" className="w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
    </form>
    <p className="mt-4 text-right"><Link href="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">Forgot password?</Link></p>
  </AuthFrame>;
}
