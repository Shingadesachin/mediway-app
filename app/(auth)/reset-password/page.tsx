"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { PasswordInput } from "@/components/PasswordInput";
import { useQuery } from "@/lib/hooks";
import { Button, Field } from "@/components/ui";

export default function ResetPassword() {
  const query = useQuery();
  const token = query?.get("token") || "";
  const portal = ["doctor", "staff", "admin"].includes(query?.get("portal") || "") ? query?.get("portal") as "doctor" | "staff" | "admin" : "patient";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "This reset link is invalid or expired.");
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <AuthFrame title="Choose a new password" sub="Reset links are valid for 30 minutes and can only be used once.">
      {done ? (
        <div className="space-y-4"><p className="rounded-xl bg-ok-50 p-3 text-sm text-ok-700" role="status">Your password has been updated.</p><Link href={portal === "doctor" ? "/doctor/login" : portal === "staff" ? "/staff/login" : portal === "admin" ? "/admin/login" : "/login"} className="font-semibold text-brand-600 hover:underline">Continue to login</Link></div>
      ) : !token ? (
        <p className="text-sm text-rescue-600" role="alert">This reset link is missing its token. <Link className="font-semibold underline" href="/forgot-password">Request another link</Link>.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password"><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
          <Field label="Confirm new password"><PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
          {error && <p className="text-sm text-rescue-600" role="alert">{error}</p>}
          <Button size="lg" className="w-full" disabled={busy}>{busy ? "Updating..." : "Reset password"}</Button>
        </form>
      )}
    </AuthFrame>
  );
}
