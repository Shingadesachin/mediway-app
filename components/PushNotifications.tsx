"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

function decodeKey(value: string) {
  const padded = value + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function PushNotifications({ compact = false }: { compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistration("/sw.js").then(async (registration) => {
      setEnabled(!!(await registration?.pushManager.getSubscription()));
    });
  }, []);

  const enable = async () => {
    setBusy(true); setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Push notifications are not supported by this browser.");
      const { publicKey } = await fetch("/api/push/key", { cache: "no-store" }).then((response) => response.json());
      if (!publicKey) throw new Error("Push notifications are not configured on this server yet.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
      const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not enable push notifications.");
      setEnabled(true);
      setMessage("Push notifications are enabled.");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };
  const disable = async () => {
    setBusy(true); setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/push/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not disable push notifications.");
        await subscription.unsubscribe();
      }
      setEnabled(false); setMessage("Push notifications are disabled.");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };

  if (compact) return <div className="flex items-center gap-2">
    <Button variant="secondary" disabled={busy} onClick={enabled ? disable : enable} className="whitespace-nowrap">{busy ? "Updating..." : enabled ? "Disable push" : "Enable push"}</Button>
    {message && <span className="max-w-48 text-xs text-slate-600" role="status">{message}</span>}
  </div>;
  return <div className="mt-4 border-t border-brand-100 pt-4">
    <p className="font-semibold">Background push alerts</p>
    <p className="mb-3 text-sm text-slate-500">Receive appointment and queue updates even when MediWay is closed.</p>
    <Button variant="secondary" disabled={busy} onClick={enabled ? disable : enable}>{busy ? "Updating..." : enabled ? "Disable push notifications" : "Enable push notifications"}</Button>
    {message && <p className="mt-2 text-sm text-slate-600" role="status">{message}</p>}
  </div>;
}
