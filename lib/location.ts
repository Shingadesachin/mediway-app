"use client";

import { useCallback, useEffect, useState } from "react";
import type { Coordinates } from "./geo";

export type { Coordinates } from "./geo";

const STORAGE_KEY = "mediway.user-location";

const MUMBAI_PLACES: Record<string, Coordinates> = {
  "andheri west": { lat: 19.1363, lng: 72.8277, label: "Andheri West" },
  "400053": { lat: 19.1363, lng: 72.8277, label: "Andheri West, 400053" },
  "bandra west": { lat: 19.0596, lng: 72.8295, label: "Bandra West" },
  "400050": { lat: 19.0596, lng: 72.8295, label: "Bandra West, 400050" },
  juhu: { lat: 19.1075, lng: 72.8263, label: "Juhu" },
  "400049": { lat: 19.1075, lng: 72.8263, label: "Juhu, 400049" },
  powai: { lat: 19.1176, lng: 72.906, label: "Powai" },
  "400076": { lat: 19.1176, lng: 72.906, label: "Powai, 400076" },
  "andheri east": { lat: 19.1136, lng: 72.8697, label: "Andheri East" },
  "400069": { lat: 19.1136, lng: 72.8697, label: "Andheri East, 400069" },
  versova: { lat: 19.13, lng: 72.812, label: "Versova" },
  "400061": { lat: 19.13, lng: 72.812, label: "Versova, 400061" },
  "goregaon east": { lat: 19.1663, lng: 72.8526, label: "Goregaon East" },
  "400063": { lat: 19.1663, lng: 72.8526, label: "Goregaon East, 400063" },
  "santacruz west": { lat: 19.0849, lng: 72.8362, label: "Santacruz West" },
  "400054": { lat: 19.0849, lng: 72.8362, label: "Santacruz West, 400054" },
  jogeshwari: { lat: 19.1374, lng: 72.8458, label: "Jogeshwari West" },
  "400102": { lat: 19.1374, lng: 72.8458, label: "Jogeshwari West, 400102" },
};

export function resolveManualLocation(query: string): Coordinates | null {
  const q = query.trim().toLowerCase()
    .replace(/^pin\s*code\s*/i, "")
    .replace(/\s+/g, " ");
  const exact = MUMBAI_PLACES[q];
  if (exact) return exact;
  const found = Object.entries(MUMBAI_PLACES).find(([name]) => !/^\d+$/.test(name) && q.includes(name));
  return found?.[1] ?? null;
}

export function useUserLocation() {
  const [location, setLocationState] = useState<Coordinates | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Coordinates;
        if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng) && typeof parsed.label === "string") setLocationState(parsed);
      }
    } catch (error) {
      console.error("Could not read the saved location.", error);
    }
    const sync = (event: Event) => setLocationState((event as CustomEvent<Coordinates | null>).detail);
    window.addEventListener("mw-location-change", sync);
    return () => window.removeEventListener("mw-location-change", sync);
  }, []);

  const setLocation = useCallback((next: Coordinates | null) => {
    setLocationState(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Could not save the selected location in this browser.", error);
    }
    window.dispatchEvent(new CustomEvent("mw-location-change", { detail: next }));
  }, []);
  return { location, setLocation };
}
