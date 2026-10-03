"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Brain, CheckSquare, Droplet, Flame, HeartPulse, LifeBuoy, Moon, Phone, Search, Square, Thermometer, Wind } from "lucide-react";
import { Badge, Card, Disclaimer, inputCls } from "@/components/ui";
import { GUIDES, Guide, WAITING_CHECKLIST, guideById, guideForText } from "@/lib/firstaid";
import { analyse, isLateNight } from "@/lib/triage";
import { useApp } from "@/lib/store";
import { useQuery } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof HeartPulse> = { HeartPulse, Brain, Droplet, Flame, Wind, Thermometer, AlertTriangle };

export default function FirstAid() {
  const { now } = useApp();
  const q = useQuery();
  const [text, setText] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});

  useEffect(() => { const p = q?.get("id"); if (p && guideById(p)) setId(p); }, [q]);
  const pick = (g: Guide | undefined) => { setId(g?.id ?? null); setDone({}); if (g) window.scrollTo({ top: 0, behavior: "smooth" }); };

  const tri = text.trim().length > 2 ? analyse(text) : null;
  const matched = text.trim().length > 2 ? guideForText(text) : undefined;
  const guide = id ? guideById(id) : undefined;
  const late = isLateNight(now);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <a href="tel:108" className="flex items-center justify-between gap-3 rounded-2xl bg-rescue-600 px-5 py-4 text-white shadow-lift hover:bg-rescue-700">
        <span><span className="block text-sm font-semibold text-rescue-50">Serious emergency?</span><span className="text-xl font-extrabold">Call 108 for an ambulance now</span></span>
        <Phone className="h-7 w-7" aria-hidden />
      </a>

      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">First aid until help arrives</h1>
        <p className="mt-1 text-slate-600">Simple steps for the minutes before an ambulance or doctor reaches you. Works without logging in.</p>
      </div>

      {(
        <Card className="flex gap-3 border-aqua-200 bg-aqua-50 p-4">
          <Moon className="mt-0.5 h-5 w-5 shrink-0 text-aqua-700" aria-hidden />
          <p className="text-sm text-slate-700"><strong>{late ? "It's late at night. " : "No clinic nearby, or it's closed? "}</strong>Call 108 first, then follow the steps below. The 24x7 centres on the <Link href="/urgent-care" className="font-semibold text-brand-700 underline">urgent care page</Link> and hospitals on the <Link href="/emergency" className="font-semibold text-brand-700 underline">emergency page</Link> stay open through the night.</p>
        </Card>
      )}

      <Card className="p-5">
        <label htmlFor="sym" className="mb-2 block font-bold">What is happening?</label>
        <div className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" aria-hidden /><input id="sym" className={cn(inputCls, "pl-12")} placeholder="e.g. chest pain, bleeding, burn, choking" value={text} onChange={(e) => setText(e.target.value)} /></div>
        {tri?.mental && (
          <p className="mt-3 rounded-xl bg-rescue-50 p-3 text-sm text-rescue-800">You are not alone. Call Tele-MANAS on <a className="font-bold underline" href="tel:14416">14416</a> (free, 24x7) or 112 if you are in danger right now. If you can, stay with someone you trust.</p>
        )}
        {text.trim().length > 2 && !tri?.mental && (matched
          ? <button onClick={() => pick(matched)} className="mt-3 w-full rounded-xl bg-brand-50 p-3 text-left text-sm text-brand-800 hover:bg-brand-100">Closest guide: <strong>{matched.title}</strong>. Tap to open.</button>
          : <p className="mt-3 text-sm text-slate-600">No exact guide found. Call 108 if the person is in serious trouble, or choose a guide below.</p>)}
      </Card>

      {guide && (
        <Card className={cn("overflow-hidden", guide.severity === "critical" ? "border-rescue-300" : "border-amber-300")}>
          <div className={cn("flex items-center justify-between gap-3 px-5 py-4", guide.severity === "critical" ? "bg-rescue-50" : "bg-amber-50")}>
            <h2 className="text-xl font-bold">{guide.title}</h2>
            <Badge tone={guide.severity === "critical" ? "red" : "amber"}>{guide.severity === "critical" ? "Call 108 now" : "Urgent"}</Badge>
          </div>
          <div className="space-y-6 p-5">
            <div>
              <h3 className="mb-2 font-bold">Do this</h3>
              <ol className="space-y-2">
                {guide.steps.map((s, i) => (
                  <li key={i}>
                    <button onClick={() => setDone({ ...done, [i]: !done[i] })} aria-pressed={!!done[i]} className="flex w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-brand-50">
                      {done[i] ? <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-ok-500" /> : <Square className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />}
                      <span className={cn("text-[15px] leading-relaxed", done[i] && "text-slate-400 line-through")}><strong className="mr-1">{i + 1}.</strong>{s}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-rescue-50 p-4"><h3 className="mb-2 font-bold text-rescue-700">Do not</h3><ul className="list-disc space-y-1 pl-5 text-sm">{guide.dont.map((d) => <li key={d}>{d}</li>)}</ul></div>
              <div className="rounded-xl bg-brand-50 p-4"><h3 className="mb-2 font-bold text-brand-700">Tell the ambulance crew</h3><ul className="list-disc space-y-1 pl-5 text-sm">{guide.tell.map((d) => <li key={d}>{d}</li>)}</ul></div>
            </div>
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Choose a situation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDES.map((g) => {
            const Icon = ICONS[g.icon] ?? LifeBuoy;
            return (
              <button key={g.id} onClick={() => pick(g)} className={cn("flex items-start gap-3 rounded-2xl border bg-white p-4 text-left shadow-soft hover:border-brand-400", id === g.id ? "border-brand-500 ring-2 ring-brand-100" : "border-brand-100")}>
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", g.severity === "critical" ? "bg-rescue-50 text-rescue-600" : "bg-amber-50 text-amber-600")}><Icon className="h-5 w-5" aria-hidden /></span>
                <span><span className="block font-bold">{g.title}</span><span className="text-sm text-slate-600">{g.blurb}</span></span>
              </button>
            );
          })}
        </div>
      </section>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-bold">While you wait for the ambulance</h2>
        <ul className="space-y-2">{WAITING_CHECKLIST.map((s) => <li key={s} className="flex gap-3 text-[15px]"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />{s}</li>)}</ul>
      </Card>
      <Disclaimer>This is general first aid guidance, not medical advice or a diagnosis. It does not replace emergency services or a doctor. When in doubt, call 108 or 112.</Disclaimer>
    </div>
  );
}
