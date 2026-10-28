"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [form, setForm] = useState({
    clinicName: "", address: "", area: "", phone: "", contactName: "", contactEmail: "",
    password: "", confirmPassword: "", openTime: "08:00", closeTime: "20:00", lat: "", lng: "", services: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const locate = () => {
    setErrors((current) => ({ ...current, location: "" }));
    if (!navigator.geolocation) {
      setErrors((current) => ({ ...current, location: "Location is unavailable. Enter the coordinates manually." }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((current) => ({ ...current, lat: String(coords.latitude), lng: String(coords.longitude) })),
      (reason) => setErrors((current) => ({
        ...current,
        location: reason.code === reason.PERMISSION_DENIED
          ? "Location permission denied. Enter the latitude and longitude manually."
          : "Could not read the location. Enter coordinates manually.",
      })),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (form.clinicName.trim().length < 2) nextErrors.clinicName = "Enter your clinic name.";
    if (form.address.trim().length < 8) nextErrors.address = "Enter the full clinic address.";
    if (form.area.trim().length < 2) nextErrors.area = "Enter the area or locality.";
    if (!validPhone(form.phone)) nextErrors.phone = "Enter a valid phone number for the selected country.";
    if (form.contactName.trim().length < 2) nextErrors.contactName = "Enter the contact person's name.";
    if (!/^\S+@\S+\.\S+$/.test(form.contactEmail.trim())) nextErrors.contactEmail = "Enter a valid email address.";
    if (form.password.length < 8) nextErrors.password = "Use at least 8 characters.";
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match.";
    if (minutes(form.openTime) >= minutes(form.closeTime)) nextErrors.hours = "Closing time must be after opening time.";
    if (form.services.split(",").map((service) => service.trim()).filter(Boolean).length === 0) nextErrors.services = "Enter at least one clinic service.";
    const lat = Number(form.lat), lng = Number(form.lng);
    if (!form.lat || !form.lng || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      nextErrors.location = "Set a valid clinic location using your device or coordinates.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const response = await fetch("/api/clinic/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          openTime: minutes(form.openTime),
          closeTime: minutes(form.closeTime),
          services: form.services.split(",").map((service) => service.trim()).filter(Boolean),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create your clinic account.");
      router.replace("/staff");
    } catch (reason) {
      setErrors((current) => ({ ...current, form: (reason as Error).message }));
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Create your clinic account" sub="Add your clinic details and set up your clinic desk login.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Clinic name" error={errors.clinicName}>
          <input className={inputCls} value={form.clinicName} onChange={(event) => update("clinicName", event.target.value)} autoComplete="organization" />
        </Field>
        <Field label="Clinic address" error={errors.address}>
          <input className={inputCls} value={form.address} onChange={(event) => update("address", event.target.value)} autoComplete="street-address" />
        </Field>
        <Field label="Area or locality" error={errors.area}>
          <input className={inputCls} value={form.area} onChange={(event) => update("area", event.target.value)} />
        </Field>
        <Field label="Clinic location" hint="Use your device location or enter decimal coordinates." error={errors.location}>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input className={inputCls} inputMode="decimal" aria-label="Latitude" placeholder="Latitude" value={form.lat} onChange={(event) => update("lat", event.target.value)} />
            <input className={inputCls} inputMode="decimal" aria-label="Longitude" placeholder="Longitude" value={form.lng} onChange={(event) => update("lng", event.target.value)} />
            <Button type="button" variant="secondary" onClick={locate}>Use location</Button>
          </div>
        </Field>
        <Field label="Clinic phone" error={errors.phone}>
          <PhoneInput value={form.phone} onChange={(value) => update("phone", value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Opening time">
            <input className={inputCls} type="time" value={form.openTime} onChange={(event) => update("openTime", event.target.value)} />
          </Field>
          <Field label="Closing time" error={errors.hours}>
            <input className={inputCls} type="time" value={form.closeTime} onChange={(event) => update("closeTime", event.target.value)} />
          </Field>
        </div>
        <Field label="Services" hint="Separate services with commas." error={errors.services}>
          <input className={inputCls} value={form.services} onChange={(event) => update("services", event.target.value)} placeholder="General consultation, X-ray" />
        </Field>
        <Field label="Contact person" error={errors.contactName}>
          <input className={inputCls} value={form.contactName} onChange={(event) => update("contactName", event.target.value)} autoComplete="name" />
        </Field>
        <Field label="Login email" error={errors.contactEmail}>
          <input className={inputCls} type="email" value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} autoComplete="email" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password}>
            <PasswordInput value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword}>
            <PasswordInput value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        {errors.form && <p className="text-sm text-rescue-600" role="alert">{errors.form}</p>}
        <Button size="lg" className="w-full" disabled={busy}>{busy ? "Creating account..." : "Create clinic account"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">Already have a clinic account? <Link href="/staff/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></p>
    </AuthFrame>
  );
}
