"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

type Application = {
  id: string; clinic_name: string; address: string; area: string; lat: number; lng: number; phone: string;
  opening_hours: string; services_json: string; contact_name: string; contact_email: string;
  status: string; created_at: number; rejection_reason: string | null;
};

export default function AdminHome() {
  const [items, setItems] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/applications", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load clinic applications.");
    setItems(result.applications);
  }, []);
  useEffect(() => { load().catch((e) => setError((e as Error).message)); }, [load]);
  const review = async (item: Application, action: "approve" | "reject") => {
    setBusy(item.id); setError("");
    try {
      const response = await fetch("/api/admin/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not review this application.");
      await load();
      if (result.emailStatus === "simulated") setError(`Approved. Simulated access email; reset link is in the server console for ${item.contact_email}.`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  };
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <h1 className="text-3xl font-bold">Clinic applications</h1>
      {error && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="alert">{error}</p>}
      {items.map((item) => (
        <Card key={item.id} className="space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-xl font-bold">{item.clinic_name}</h2><p className="text-sm text-slate-600">{item.address}, {item.area}</p></div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold capitalize text-brand-700">{item.status}</span>
          </div>
          <p className="text-sm">Contact: <strong>{item.contact_name}</strong> · {item.contact_email} · {item.phone}</p>
          <p className="text-sm">Location pin: {item.lat.toFixed(5)}, {item.lng.toFixed(5)} · Services: {JSON.parse(item.services_json).join(", ")}</p>
          {item.rejection_reason && <p className="text-sm text-rescue-700">Reason: {item.rejection_reason}</p>}
          {item.status === "pending" && <div className="flex gap-2"><Button disabled={!!busy} onClick={() => review(item, "approve")}>{busy === item.id ? "Processing..." : "Approve"}</Button><Button variant="danger" disabled={!!busy} onClick={() => review(item, "reject")}>Reject</Button></div>}
        </Card>
      ))}
      {!items.length && !error && <p className="text-slate-600">No clinic applications yet.</p>}
    </main>
  );
}
