"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { Button, Field, inputCls } from "@/components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please wait before trying again.");
      setMessage(result.message);
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <AuthFrame title="Forgot your password?" sub="Enter the email address linked to your account.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email address"><input className={inputCls} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        {error && <p className="text-sm text-rescue-600" role="alert">{error}</p>}
        {message && <p className="rounded-xl bg-ok-50 p-3 text-sm text-ok-700" role="status">{message}</p>}
        <Button size="lg" className="w-full" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600"><Link href="/login" className="font-semibold text-brand-600 hover:underline">Back to login</Link></p>
    </AuthFrame>
  );
}
