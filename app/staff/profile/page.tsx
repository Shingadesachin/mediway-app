"use client";

import Link from "next/link";
import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { Button, Card, Field, inputCls } from "@/components/ui";
import { useStaff } from "@/lib/staff-store";

export default function StaffProfile() {
  const { state, refresh, toast } = useStaff();
  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const forced = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("forcePassword") === "1";
  const save = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/staff/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your profile.");
      await refresh(); toast("success", "Profile saved.");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not change your password.");
      setCurrentPassword(""); setNewPassword(""); await refresh(); toast("success", "Password changed.");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div><h1 className="text-2xl font-bold">Staff profile</h1><p className="text-slate-600">Update your account details and password.</p></div>
      {forced && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800" role="alert">Change your password to continue using the clinic desk.</p>}
      {error && <p className="rounded-xl bg-rescue-50 p-3 text-sm text-rescue-700" role="alert">{error}</p>}
      <Card className="space-y-4 p-5">
        <Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Button disabled={busy} onClick={save}>Save profile</Button>
      </Card>
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold">Change password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Current password"><PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" /></Field>
          <Field label="New password"><PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" /></Field>
          <Button disabled={busy || newPassword.length < 8}>Change password</Button>
        </form>
      </Card>
      {!forced && <p className="text-sm text-slate-600"><Link href="/staff" className="text-brand-600 underline">Back to clinic desk</Link></p>}
    </div>
  );
}
