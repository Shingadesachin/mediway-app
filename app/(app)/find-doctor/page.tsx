"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Stethoscope } from "lucide-react";
import { FindTabs } from "@/components/FindTabs";
import { DoctorCard } from "@/components/DoctorCard";
import { Button, Card, Chip, EmptyState, inputCls, PageHeader } from "@/components/ui";
import { DOCTORS, SPECIALTIES, getClinic } from "@/lib/data";
import { freeSlots } from "@/lib/engine";
import { useQuery } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { rupee, toISO } from "@/lib/utils";

export default function FindDoctor() {
  const { ctx } = useApp();
  const q = useQuery();
  const [text, setText] = useState("");
  const [spec, setSpec] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [today, setToday] = useState(false);
  const [maxFee, setMaxFee] = useState(2000);
  const [maxKm, setMaxKm] = useState(15);
  const [sort, setSort] = useState("rating");
  const init = useRef(false);
  useEffect(() => { if (q && !init.current) { init.current = true; setText(q.get("q") ?? ""); setSpec(q.get("specialty") ?? ""); } }, [q]);

  const list = useMemo(() => {
    const t = text.trim().toLowerCase();
    const day = toISO(ctx.now);
    return DOCTORS.filter((d) => {
      const c = getClinic(d.clinicId);
      if (t && !`${d.name} ${d.specialty} ${c.name} ${c.area} ${d.treats.join(" ")}`.toLowerCase().includes(t)) return false;
      if (spec && d.specialty !== spec) return false;
      if (d.rating < minRating || d.fee > maxFee || c.distanceKm > maxKm) return false;
      if (today && !freeSlots(d, day, ctx).length) return false;
      return true;
    }).sort((a, b) => sort === "fee" ? a.fee - b.fee : sort === "near" ? getClinic(a.clinicId).distanceKm - getClinic(b.clinicId).distanceKm : sort === "exp" ? b.exp - a.exp : b.rating - a.rating);
  }, [text, spec, minRating, today, maxFee, maxKm, sort, ctx]);

  const reset = () => { setText(""); setSpec(""); setMinRating(0); setToday(false); setMaxFee(2000); setMaxKm(15); };

  return (
    <div>
      <PageHeader title="Find a doctor" sub="Search by name, specialty or condition. See who has slots today." />
      <FindTabs />
      <Card className="mb-6 space-y-4 p-4 sm:p-5">
        <div className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-brand-500" /><input className={inputCls + " pl-12"} value={text} onChange={(e) => setText(e.target.value)} placeholder="Doctor, specialty or problem (e.g. skin rash)" aria-label="Search doctors" /></div>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Specialty filter">
          <Chip active={!spec} onClick={() => setSpec("")}>All</Chip>
          {SPECIALTIES.map((s) => <Chip key={s} active={spec === s} onClick={() => setSpec(spec === s ? "" : s)}>{s}</Chip>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-semibold">Rating<select className={inputCls + " mt-1.5"} value={minRating} onChange={(e) => setMinRating(+e.target.value)}><option value={0}>Any</option><option value={4}>4.0 and above</option><option value={4.5}>4.5 and above</option></select></label>
          <label className="text-sm font-semibold">Sort by<select className={inputCls + " mt-1.5"} value={sort} onChange={(e) => setSort(e.target.value)}><option value="rating">Top rated</option><option value="near">Nearest</option><option value="fee">Lowest fee</option><option value="exp">Most experienced</option></select></label>
          <label className="text-sm font-semibold">Within {maxKm} km<input type="range" min={1} max={15} value={maxKm} onChange={(e) => setMaxKm(+e.target.value)} className="mt-1.5 h-12 w-full" /></label>
          <label className="text-sm font-semibold">Fee up to {rupee(maxFee)}<input type="range" min={300} max={2000} step={100} value={maxFee} onChange={(e) => setMaxFee(+e.target.value)} className="mt-1.5 h-12 w-full" /></label>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5" checked={today} onChange={(e) => setToday(e.target.checked)} /> Available today</label>
        </div>
      </Card>
      <p className="mb-3 text-sm text-slate-600" aria-live="polite">{list.length} {list.length === 1 ? "doctor" : "doctors"} found</p>
      {list.length ? <div className="grid gap-4 md:grid-cols-2">{list.map((d) => <DoctorCard key={d.id} doctor={d} />)}</div> : <EmptyState icon={<Stethoscope className="h-6 w-6" />} title="No doctors match your filters" body="Try removing a filter or widening the distance." action={<Button onClick={reset}>Clear filters</Button>} />}
    </div>
  );
}
