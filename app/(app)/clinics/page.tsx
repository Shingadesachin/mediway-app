"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, MapPin, Search } from "lucide-react";
import { FindTabs } from "@/components/FindTabs";
import { ClinicCard } from "@/components/ClinicCard";
import { MapPanel } from "@/components/MapPanel";
import { Button, Card, EmptyState, inputCls, PageHeader } from "@/components/ui";
import { CLINICS, SPECIALTIES, clinicSpecialties, doctorsOf } from "@/lib/data";
import { freeSlots, isClinicOpen } from "@/lib/engine";
import { useQuery } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { rupee, toISO } from "@/lib/utils";

export default function Clinics() {
  const { ctx, now } = useApp();
  const q = useQuery();
  const [text, setText] = useState("");
  const [loc, setLoc] = useState("");
  const [spec, setSpec] = useState("");
  const [maxKm, setMaxKm] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [avail, setAvail] = useState(false);
  const [maxFee, setMaxFee] = useState(2000);
  const [sel, setSel] = useState<string | null>(null);
  const init = useRef(false);
  useEffect(() => { if (q && !init.current) { init.current = true; setText(q.get("q") ?? ""); setLoc(q.get("loc") ?? ""); } }, [q]);

  const list = useMemo(() => {
    const t = text.trim().toLowerCase();
    const day = toISO(ctx.now);
    return CLINICS.filter((c) => {
      if (t && !`${c.name} ${c.area} ${c.address} ${clinicSpecialties(c.id).join(" ")}`.toLowerCase().includes(t)) return false;
      if (spec && !clinicSpecialties(c.id).includes(spec)) return false;
      if (c.distanceKm > maxKm || c.rating < minRating) return false;
      if (!doctorsOf(c.id).some((d) => d.fee <= maxFee)) return false;
      if (avail && !(isClinicOpen(c, now) && doctorsOf(c.id).some((d) => freeSlots(d, day, ctx).length))) return false;
      return true;
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [text, spec, maxKm, minRating, avail, maxFee, ctx, now]);

  const reset = () => { setText(""); setSpec(""); setMaxKm(10); setMinRating(0); setAvail(false); setMaxFee(2000); };

  return (
    <div>
      <PageHeader title="Find a clinic" sub="Clinics near you with opening hours, wait times and open slots." />
      <FindTabs />
      <Card className="mb-6 space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-brand-500" /><input className={inputCls + " pl-12"} value={text} onChange={(e) => setText(e.target.value)} placeholder="Clinic name or area" aria-label="Search clinics" /></div>
          <div className="relative"><MapPin className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-brand-500" /><input className={inputCls + " pl-12"} value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Enter your location" aria-label="Location" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-semibold">Specialty<select className={inputCls + " mt-1.5"} value={spec} onChange={(e) => setSpec(e.target.value)}><option value="">All</option>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="text-sm font-semibold">Within {maxKm} km<input type="range" min={1} max={15} value={maxKm} onChange={(e) => setMaxKm(+e.target.value)} className="mt-1.5 h-12 w-full" /></label>
          <label className="text-sm font-semibold">Rating<select className={inputCls + " mt-1.5"} value={minRating} onChange={(e) => setMinRating(+e.target.value)}><option value={0}>Any</option><option value={4}>4.0 and above</option><option value={4.5}>4.5 and above</option></select></label>
          <label className="text-sm font-semibold">Fee up to {rupee(maxFee)}<input type="range" min={300} max={2000} step={100} value={maxFee} onChange={(e) => setMaxFee(+e.target.value)} className="mt-1.5 h-12 w-full" /></label>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5" checked={avail} onChange={(e) => setAvail(e.target.checked)} /> Open with slots today</label>
        </div>
      </Card>
      <p className="mb-3 text-sm text-slate-600" aria-live="polite">{list.length} {list.length === 1 ? "clinic" : "clinics"} found</p>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          {list.length === 0 ? <EmptyState icon={<Building2 className="h-6 w-6" />} title="No clinics found nearby." body="Try a larger distance or remove some filters." action={<Button onClick={reset}>Clear filters</Button>} /> : list.map((c) => <ClinicCard key={c.id} clinic={c} highlight={sel === c.id} onHover={() => setSel(c.id)} />)}
        </div>
        <div className="hidden lg:block"><MapPanel className="sticky top-24 h-[520px]" items={list.map((c) => ({ id: c.id, label: c.name, x: c.x, y: c.y, kind: c.urgent ? "urgent" as const : "clinic" as const }))} selected={sel} onSelect={setSel} /></div>
      </div>
    </div>
  );
}
