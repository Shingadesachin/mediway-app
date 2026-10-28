"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { PasswordInput } from "@/components/PasswordInput";
import { PhoneInput } from "@/components/PhoneInput";
import { Button, Field, inputCls } from "@/components/ui";
import { validPhone } from "@/lib/utils";

const minutes = (time: string) => {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
};

export default function ClinicSignup() {
  const [form, setForm] = useState({
    clinicName: "", address: "", area: "", phone: "", contactName: "", contactEmail: "",
    password: "", openTime: "08:00", closeTime: "20:00", lat: "", lng: "", services: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const locate = () => {
    setError("");
    if (!navigator.geolocation) return setError("Location is unavailable in this browser. Enter the coordinates manually.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((current) => ({ ...current, lat: String(coords.latitude), lng: String(coords.longitude) })),
      (reason) => setError(reason.code === reason.PERMISSION_DENIED ? "Location permission denied. Enter the latitude and longitude manually." : "Could not read the location. Enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!validPhone(form.phone)) return setError("Enter a valid phone number.");
    if (form.password.length < 8) return setError("Use at least 8 characters for the password.");
    if (minutes(form.openTime) >= minutes(form.closeTime)) return setError("Closing time must be after opening time.");
    setBusy(true);
    try {
      const response = await fetch("/api/clinic/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          openTime: minutes(form.openTime), closeTime: minutes(form.closeTime),
          services: form.services.split(",").map((service) => service.trim()).filter(Boolean),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not submit the application.");
      setMessage("Application submitted. The MediWay team will review it and contact you by email.");
      setForm((current) => ({ ...current, password: "" }));
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <AuthFrame title="Register your clinic" sub="Submit a clinic application for review by the MediWay team.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Clinic name"><input className={inputCls} value={form.clinicName} onChange={(e) => update("clinicName", e.target.value)} required /></Field>
        <Field label="Address"><input className={inputCls} value={form.address} onChange={(e) => update("address", e.target.value)} required /></Field>
        <Field label="Area or locality"><input className={inputCls} value={form.area} onChange={(e) => update("area", e.target.value)} required /></Field>
        <Field label="Location pin" hint="Use your device location or enter decimal coordinates."><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input className={inputCls} inputMode="decimal" aria-label="Latitude" placeholder="Latitude" value={form.lat} onChange={(e) => update("lat", e.target.value)} required /><input className={inputCls} inputMode="decimal" aria-label="Longitude" placeholder="Longitude" value={form.lng} onChange={(e) => update("lng", e.target.value)} required /><Button type="button" variant="secondary" onClick={locate}>Use location</Button></div></Field>
        <Field label="Clinic phone"><PhoneInput value={form.phone} onChange={(value) => update("phone", value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Opening time"><input className={inputCls} type="time" value={form.openTime} onChange={(e) => update("openTime", e.target.value)} /></Field><Field label="Closing time"><input className={inputCls} type="time" value={form.closeTime} onChange={(e) => update("closeTime", e.target.value)} /></Field></div>
        <Field label="Services" hint="Separate services with commas."><input className={inputCls} value={form.services} onChange={(e) => update("services", e.target.value)} placeholder="General consultation, X-ray" required /></Field>
        <Field label="Contact person"><input className={inputCls} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} required /></Field>
        <Field label="Contact email"><input className={inputCls} type="email" autoComplete="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} required /></Field>
        <Field label="Application password" hint="Used for your clinic desk login after approval."><PasswordInput value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" /></Field>
        {error && <p className="text-sm text-rescue-600" role="alert">{error}</p>}
        {message && <p className="rounded-xl bg-ok-50 p-3 text-sm text-ok-700" role="status">{message}</p>}
        <Button size="lg" className="w-full" disabled={busy}>{busy ? "Submitting..." : "Submit application"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">Already approved? <Link href="/staff/login" className="font-semibold text-brand-600 hover:underline">Clinic login</Link></p>
    </AuthFrame>
  );
}
