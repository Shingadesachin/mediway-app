"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, MapPin, Search, Siren, Sparkles } from "lucide-react";
import { FindTabs } from "@/components/FindTabs";
import { DoctorCard } from "@/components/DoctorCard";
import { Button, ButtonLink, Card, Disclaimer, EmptyState, ErrorState, Field, inputCls, PageHeader, Skeleton, Toggle } from "@/components/ui";
import { SPECIALTIES } from "@/lib/data";
import { Rec, recommend } from "@/lib/engine";
import { useQuery } from "@/lib/hooks";
import { analyse, Triage } from "@/lib/triage";
import { useApp } from "@/lib/store";
import { fmtTime, fromMin, rupee, toISO } from "@/lib/utils";

const STEPS = ["Analyzing your preferences...", "Finding suitable healthcare providers...", "Ranking nearby options..."];
const TIMES = Array.from({ length: 36 }, (_, i) => fromMin(360 + i * 30)); // 6:00 to 23:30

export default function Recommendations() {
  const { ctx, waits, now, user } = useApp();
  const q = useQuery();
  const today = toISO(now);
  const [f, setF] = useState({ text: "", specialty: "", loc: user?.location && user.location !== "Current location" ? user.location : "", date: today, time: "", maxKm: 8, maxFee: 1500, urgent: false });
  const [phase, setPhase] = useState<"form" | "loading" | "results" | "error">("form");
  const [step, setStep] = useState(0);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [tri, setTri] = useState<Triage | null>(null);
  const [usedSpec, setUsedSpec] = useState("");
  const started = useRef(false);

  const run = async (override?: Partial<typeof f>) => {
    const v = { ...f, ...override };
    setPhase("loading"); setStep(0);
    const t = analyse(v.text);
    const spec = v.specialty || t.specialty || "";
    try {
      // Simulated API call. Replace with: await fetch("/api/recommend", { method: "POST", body: JSON.stringify(v) })
      for (let i = 0; i < STEPS.length; i++) { setStep(i); await new Promise((r) => setTimeout(r, 800)); }
      if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("offline");
      const r = recommend({ specialty: spec, date: v.date, time: v.time, maxKm: v.maxKm, maxFee: v.maxFee, urgent: v.urgent }, ctx, waits);
      setRecs(r); setTri(t); setUsedSpec(spec); setPhase("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setPhase("error"); }
  };

  useEffect(() => {
    if (!q || started.current) return;
    started.current = true;
    const p = { text: q.get("text") ?? "", specialty: q.get("specialty") ?? "", loc: q.get("loc") ?? f.loc };
    if (p.text || p.specialty || p.loc) setF((x) => ({ ...x, ...p }));
    if (q.get("run")) run(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  return (
    <div>
      <PageHeader title="Find the Best Care for You" sub="Tell us what you need. We suggest who to see and show who is free. We don't diagnose." />
      <FindTabs />

      {(phase === "form" || phase === "results" || phase === "error") && (
        <Card className="mb-6 p-5 sm:p-6">
          <form onSubmit={(e) => { e.preventDefault(); run(); }} className="space-y-5">
            <Field label="Symptoms or reason for visit" hint="Example: I need a doctor for persistent skin problems.">
              <textarea className={inputCls + " h-24 resize-none py-3"} value={f.text} onChange={(e) => set("text", e.target.value)} placeholder="Describe what you need help with" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Required specialty" hint="Leave on Not sure and we'll suggest one.">
                <select className={inputCls} value={f.specialty} onChange={(e) => set("specialty", e.target.value)}><option value="">Not sure</option>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field label="Preferred location">
                <div className="relative"><MapPin className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-brand-500" /><input className={inputCls + " pl-12"} value={f.loc} onChange={(e) => set("loc", e.target.value)} placeholder="Enter your location" /></div>
              </Field>
              <Field label="Preferred appointment date"><input type="date" className={inputCls} min={today} value={f.date} disabled={f.urgent} onChange={(e) => set("date", e.target.value || today)} /></Field>
              <Field label="Preferred appointment time">
                <select className={inputCls} value={f.time} disabled={f.urgent} onChange={(e) => set("time", e.target.value)}><option value="">Any time</option>{TIMES.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}</select>
              </Field>
              <Field label={`Distance: within ${f.maxKm} km`}><input type="range" min={1} max={15} value={f.maxKm} onChange={(e) => set("maxKm", +e.target.value)} className="h-12 w-full" /></Field>
              <Field label={`Consultation fee: up to ${rupee(f.maxFee)}`}><input type="range" min={300} max={2000} step={100} value={f.maxFee} onChange={(e) => set("maxFee", +e.target.value)} className="h-12 w-full" /></Field>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-aqua-50 p-4">
              <div><p className="font-semibold">This is urgent</p><p className="text-sm text-slate-600">Only open urgent care clinics, ranked by current wait time.</p></div>
              <Toggle checked={f.urgent} onChange={(v) => set("urgent", v)} label="This is urgent" />
            </div>
            <Button size="lg" className="w-full sm:w-auto"><Sparkles className="h-5 w-5" /> Get Recommendations</Button>
          </form>
        </Card>
      )}

      {phase === "loading" && (
        <Card className="p-6" role="status" aria-live="polite">
          <div className="flex items-center gap-3"><span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" /><p className="font-semibold">{STEPS[step]}</p></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
        </Card>
      )}

      {phase === "error" && <ErrorState message="We couldn't generate recommendations. Check your connection and try again." onRetry={() => run()} />}

      {phase === "results" && (
        <div className="space-y-5">
          {tri && (tri.redFlags.length > 0 || tri.mental) && (
            <div className="rounded-2xl border-2 border-rescue-500 bg-rescue-50 p-5" role="alert">
              <p className="flex items-center gap-2 text-lg font-bold text-rescue-700"><AlertTriangle className="h-5 w-5" /> {tri.mental ? "You deserve support right now" : tri.redFlags[0].label}</p>
              <p className="mt-1 text-slate-700">{tri.mental ? "If you are thinking about harming yourself, please call Tele-MANAS at 14416 or 112 now, or go to the nearest emergency department. You don't have to wait for an appointment." : "This may be serious. Call 108 or 112 now, or go to the nearest emergency department. Don't wait for an appointment."} MediWay can't diagnose emergencies.</p>
              <div className="mt-3 flex flex-wrap gap-3"><ButtonLink href="/emergency" variant="danger"><Siren className="h-4 w-4" /> Emergency Help</ButtonLink>{tri.redFlags[0] && <ButtonLink href={`/first-aid?id=${tri.redFlags[0].aid}`} variant="secondary">First aid steps</ButtonLink>}</div>
            </div>
          )}
          <div className="rounded-2xl bg-brand-600 p-5 text-white">
            <p className="flex items-center gap-2 text-sm text-brand-200"><Sparkles className="h-4 w-4" /> MediWay AI</p>
            <p className="mt-1 text-xl font-bold">{f.urgent ? "Here are urgent care options open now." : usedSpec ? `Based on your requirements, ${/^[AEIOU]/i.test(usedSpec) ? "an" : "a"} ${usedSpec} may be suitable.` : "Here are doctors that fit your preferences."}</p>
            {tri && tri.matched.length > 0 && <p className="mt-1 text-sm text-brand-200">You mentioned: {tri.matched.slice(0, 3).join(", ")}.</p>}
          </div>
          {recs.length === 0 ? (
            <EmptyState icon={<Search className="h-6 w-6" />} title="No clinics found nearby." body="Try a larger distance, a higher fee limit, or a different specialty." action={<Button onClick={() => run({ maxKm: 15, maxFee: 2000 })}>Widen my search</Button>} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">{recs.map((r, i) => <DoctorCard key={r.doctor.id} doctor={r.doctor} rec={r} best={i === 0} date={f.urgent ? undefined : f.date} time={f.time || undefined} />)}</div>
          )}
          <p className="text-sm text-slate-500">The AI Match Score ranks specialty fit, distance, availability, rating and fee. It is a convenience indicator, not a measure of medical accuracy.</p>
          <Disclaimer />
        </div>
      )}
    </div>
  );
}
