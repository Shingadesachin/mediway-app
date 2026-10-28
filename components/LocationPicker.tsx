"use client";

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import type { Coordinates } from "@/lib/location";
import { resolveManualLocation } from "@/lib/location";
import { Button, inputCls } from "./ui";

export function LocationPicker({ location, onChange }: { location: Coordinates | null; onChange: (location: Coordinates | null) => void }) {
  const [area, setArea] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const locate = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Location is unavailable in this browser. Enter your area or PIN code instead.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({ lat: coords.latitude, lng: coords.longitude, label: "Current location" });
        setLoading(false);
      },
      (reason) => {
        setLoading(false);
        setError(reason.code === reason.PERMISSION_DENIED
          ? "Location permission was denied. Enter your area or PIN code instead."
          : "We couldn't determine your location. Enter your area or PIN code instead.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const submitArea = (event: React.FormEvent) => {
    event.preventDefault();
    void resolveArea();
  };
  const resolveArea = async () => {
    setError("");
    const resolved = resolveManualLocation(area);
    if (resolved) {
      onChange(resolved);
      return;
    }
    const pin = area.trim().replace(/^pin\s*code\s*/i, "").replace(/\s/g, "");
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setError("Enter a supported area name or a valid 6-digit Indian PIN code.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/location/resolve?pincode=${encodeURIComponent(pin)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not find that PIN code.");
      onChange(result);
    } catch (reason) {
      setError((reason as Error).message || "PIN code lookup failed. Try again or enter your area.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-brand-100 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-brand-600" />{location ? `Searching near ${location.label}` : "Set your location to calculate distances"}</p>
        {location && <button type="button" className="text-xs font-semibold text-slate-500 underline" onClick={() => onChange(null)}>Clear</button>}
      </div>
      <p className="text-xs text-slate-500">Tap to request browser location permission, or enter an area or 6-digit Indian PIN code. PIN lookup uses OpenStreetMap; coordinates stay in this browser.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={locate}><Navigation className="h-4 w-4" />{loading ? "Finding..." : "Use my location"}</Button>
        <form className="flex min-w-[15rem] flex-1 gap-2" onSubmit={submitArea}>
          <input className={inputCls + " h-9 min-w-0 text-sm"} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area or PIN code" aria-label="Enter area or PIN code" />
          <Button size="sm" type="submit" disabled={loading}>{loading ? "Looking up..." : "Find nearby"}</Button>
        </form>
      </div>
      {error && <p className="text-xs text-rescue-600" role="status">{error}</p>}
    </div>
  );
}
