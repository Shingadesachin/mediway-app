"use client";
import { cn } from "@/lib/utils";

export interface MapItem { id: string; label: string; x: number; y: number; kind: "clinic" | "urgent" | "hospital" }

/** Stylised map. Swap for Google Maps / Mapbox by feeding real coordinates to the same props. */
export function MapPanel({ items, selected, onSelect, className }: { items: MapItem[]; selected?: string | null; onSelect?: (id: string) => void; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-brand-100 bg-brand-50", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="100" height="100" fill="#EAF2FB" />
        <path d="M0 80 C20 70 30 90 55 82 S85 70 100 78 V100 H0Z" fill="#CFE3F7" />
        <rect x="8" y="8" width="16" height="12" rx="3" fill="#D5EEE3" />
        <rect x="72" y="70" width="18" height="14" rx="3" fill="#D5EEE3" />
        {[15, 32, 50, 68, 86].map((p) => (<g key={p}><path d={`M${p} 0V100`} stroke="#fff" strokeWidth="1.6" /><path d={`M0 ${p}H100`} stroke="#fff" strokeWidth="1.6" /></g>))}
        <path d="M0 30 L100 62" stroke="#fff" strokeWidth="2.4" />
        <path d="M20 0 L62 100" stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="absolute" style={{ left: "50%", top: "55%" }}>
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-brand-500/30 animate-ping2" />
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-white bg-brand-600 shadow" />
        <span className="absolute left-3 top-1 whitespace-nowrap rounded bg-white/90 px-1.5 text-[11px] font-semibold text-brand-700">You</span>
      </div>
      {items.map((it) => {
        const on = selected === it.id;
        return (
          <button key={it.id} onClick={() => onSelect?.(it.id)} aria-label={it.label} aria-pressed={on} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${it.x}%`, top: `${it.y}%`, zIndex: on ? 20 : 10 }}>
            <span className={cn("grid h-8 w-8 place-items-center rounded-full border-2 border-white text-xs font-extrabold text-white shadow-md transition-transform", on && "scale-125", it.kind === "hospital" ? "bg-rescue-600" : it.kind === "urgent" ? "bg-aqua-600" : "bg-brand-600")}>
              {it.kind === "hospital" ? "+" : it.kind === "urgent" ? "!" : "C"}
            </span>
            {on && <span className="absolute left-1/2 top-9 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-semibold text-white">{it.label}</span>}
          </button>
        );
      })}
      <p className="absolute bottom-2 left-3 rounded bg-white/80 px-2 py-0.5 text-[11px] text-slate-500">Sample map. Connect Google Maps for live locations.</p>
    </div>
  );
}
