"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, Moon, Navigation, Siren, Timer } from "lucide-react";
import Link from "next/link";
import { FindTabs } from "@/components/FindTabs";
import { MapPanel } from "@/components/MapPanel";
import { Badge, ButtonLink, Card, Chip, Disclaimer, EmptyState, inputCls, PageHeader, Rating } from "@/components/ui";
import { CLINICS, doctorsOf } from "@/lib/data";
import { doctorLive, hoursLabel, isClinicOpen, nextFree, urgentScore } from "@/lib/engine";
import { analyse, isLateNight } from "@/lib/triage";
import { useApp } from "@/lib/store";
import { cn, dayLabel, fmtTime, mapsDirections } from "@/lib/utils";

type Sort = "best" | "wait" | "near" | "rating";
const liveTone = { now: "green", busy: "amber", off: "gray", emergency: "red" } as const;

export default function UrgentCare() {
  const { ctx, waits, now } = useApp();
  const [problem, setProblem] = useState("");
  const [sort, setSort] = useState<Sort>("best");
  const [openOnly, setOpenOnly] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const tri = useMemo(() => analyse(problem), [problem]);
  const needsSpec = tri.specialty && tri.specialty !== "General Physician" ? tri.specialty : null;

  const list = useMemo(() => {
    const rows = CLINICS.filter((c) => c.urgent && (!openOnly || isClinicOpen(c, now))).map((c) => {
      const w = waits[c.id] ?? c.baseWait;
      const fit = needsSpec ? doctorsOf(c.id).some((d) => d.specialty === needsSpec) : true;
      return { c, w, fit, score: urgentScore(c, w) + (fit && needsSpec ? 25 : 0) };
    });
    rows.sort((a, b) => (sort === "wait" ? a.w - b.w : sort === "near" ? a.c.distanceKm - b.c.distanceKm : sort === "rating" ? b.c.rating - a.c.rating : b.score - a.score));
    return rows;
  }, [waits, sort, openOnly, needsSpec, now]);

  return (
    <div>
      <PageHeader title="Urgent care near you" sub="Live doctor availability and wait times. Best-rated clinics with the shortest wait come first." />
      <FindTabs />
      {isLateNight(now) && (
        <div className="mb-5 flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800"><Moon className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>It's late.</strong> Most clinics are closed. Clinics open now are listed first. If you are far from a clinic, see the <Link href="/first-aid" className="font-semibold underline">first aid guide</Link>.</div></div>
      )}
      <Card className="mb-5 p-4 sm:p-5">
        <label className="block text-sm font-semibold" htmlFor="prob">What is the problem? <span className="font-normal text-slate-500">(optional, helps us rank clinics for your condition)</span></label>
        <input id="prob" className={inputCls + " mt-2"} value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="e.g. child with high fever, twisted ankle, stomach pain" />
        {needsSpec && <p className="mt-2 text-sm text-brand-700">Clinics with a <strong>{needsSpec}</strong> are ranked higher.</p>}
        {tri.redFlags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-rescue-50 p-3 text-sm text-rescue-700" role="alert">
            <AlertTriangle className="h-5 w-5 shrink-0" /><span className="flex-1"><strong>{tri.redFlags[0].label}.</strong> Call 108 or go to the nearest emergency department. Do not wait for a clinic slot.</span>
            <ButtonLink href="/emergency" size="sm" variant="danger"><Siren className="h-4 w-4" /> Emergency Help</ButtonLink>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {([["best", "Best match"], ["wait", "Shortest wait"], ["near", "Nearest"], ["rating", "Top rated"]] as [Sort, string][]).map(([v, l]) => <Chip key={v} active={sort === v} onClick={() => setSort(v)}>{l}</Chip>)}
          <label className="ml-auto flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-4 w-4" /> Open now only</label>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {list.length === 0 && <EmptyState icon={<Timer className="h-6 w-6" />} title="No urgent care clinics open nearby" body="Try turning off 'Open now only', or read first aid steps while you arrange transport." action={<ButtonLink href="/first-aid">First aid guide</ButtonLink>} />}
          {list.map(({ c, w, fit }, i) => (
            <Card key={c.id} className={cn("p-5", i === 0 && "border-aqua-500 ring-2 ring-aqua-200", sel === c.id && "ring-2 ring-brand-300")} onMouseEnter={() => setSel(c.id)}>
              <div className="flex items-start gap-4">
                <div className="w-20 shrink-0 rounded-2xl bg-ink py-3 text-center text-white">
                  <p className={cn("tnum font-display text-3xl font-extrabold leading-none", w <= 15 ? "text-ok-100" : w <= 30 ? "text-amber-100" : "text-rescue-200")}>{w}</p>
                  <p className="text-[11px] text-brand-200">min wait</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">{i === 0 && <Badge tone="aqua">Best for you</Badge>}{needsSpec && fit && <Badge tone="blue">Has {needsSpec}</Badge>}<Badge tone={isClinicOpen(c, now) ? "green" : "gray"}>{isClinicOpen(c, now) ? "Open now" : "Closed"}</Badge></div>
                  <h3 className="mt-1.5 text-lg font-bold">{c.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-slate-600"><Rating value={c.rating} count={c.reviews} /><span>{c.distanceKm} km, {c.area}</span><span>{hoursLabel(c)}</span></div>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-brand-100 rounded-xl border border-brand-100">
                {doctorsOf(c.id).map((d) => { const l = doctorLive(d, ctx); const nf = nextFree(d, ctx, 2); return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span><strong>{d.name}</strong> <span className="text-slate-500">{d.specialty}</span></span>
                    <span className="flex items-center gap-2"><Badge tone={liveTone[l.key]}>{l.label}</Badge>{nf && l.key !== "emergency" && <span className="text-slate-500">{dayLabel(nf.date, now)} {fmtTime(nf.time)}</span>}</span>
                  </li>
                ); })}
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ButtonLink variant="secondary" href={mapsDirections(`${c.name}, ${c.address}`)} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" /> Directions</ButtonLink>
                <ButtonLink href={`/book?clinic=${c.id}&urgent=1`}>Get a token</ButtonLink>
              </div>
            </Card>
          ))}
        </div>
        <div className="hidden lg:block"><div className="sticky top-24 space-y-4"><MapPanel className="h-[420px]" items={list.map(({ c }) => ({ id: c.id, label: c.name, x: c.x, y: c.y, kind: "urgent" as const }))} selected={sel} onSelect={setSel} /><Disclaimer /></div></div>
      </div>
      <div className="mt-6 lg:hidden"><Disclaimer /></div>
    </div>
  );
}
