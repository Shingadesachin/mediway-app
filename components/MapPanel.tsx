"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { Coordinates } from "@/lib/geo";
import { mapsDirections } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface MapItem {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: "clinic" | "urgent" | "hospital";
}

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-64 place-items-center text-sm text-slate-500">Loading live map…</div>,
});

class MapErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("The interactive map could not be loaded.", error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function MapPanel({
  items,
  selected,
  onSelect,
  userLocation,
  className,
}: {
  items: MapItem[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  userLocation?: Coordinates | null;
  className?: string;
}) {
  const fallback = (
    <div className="h-full min-h-64 overflow-y-auto rounded-3xl border border-brand-100 bg-white p-4">
      <p className="mb-3 text-sm font-semibold">Map unavailable. Here are the locations:</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 p-3 text-sm">
            <button type="button" className="min-w-0 text-left font-semibold text-brand-700 hover:underline" onClick={() => onSelect?.(item.id)}>{item.label}</button>
            <a className="shrink-0 text-brand-600 underline" href={mapsDirections(`${item.lat},${item.lng}`)} target="_blank" rel="noreferrer">Directions</a>
          </li>
        ))}
      </ul>
    </div>
  );
  const key = `${userLocation?.lat ?? ""}:${userLocation?.lng ?? ""}:${items.map((x) => x.id).join(",")}`;
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-brand-100 bg-white", className)}>
      <MapErrorBoundary fallback={fallback}>
        <LeafletMap key={key} items={items} selected={selected} onSelect={onSelect} userLocation={userLocation} />
      </MapErrorBoundary>
    </div>
  );
}
