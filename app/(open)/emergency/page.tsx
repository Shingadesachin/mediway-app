"use client";
import Link from "next/link";
import { useState } from "react";
import { Ambulance, Building2, HeartPulse, MapPin, Navigation, Phone, Share2, Siren } from "lucide-react";
import { MapPanel } from "@/components/MapPanel";
import { Badge, ButtonLink, Card, Chip } from "@/components/ui";
import { EMERGENCY_CONTACTS, HOSPITALS } from "@/lib/data";
import { cn, mapsDirections } from "@/lib/utils";

type Tab = "nearest" | "er" | "contact" | "directions";
const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "nearest", label: "Nearest Hospital", icon: Building2 },
  { id: "er", label: "Emergency Department", icon: Siren },
  { id: "contact", label: "Ambulance / Emergency Contact", icon: Ambulance },
  { id: "directions", label: "Get Directions", icon: Navigation },
];

export default function Emergency() {
  const [tab, setTab] = useState<Tab>("nearest");
  const [sel, setSel] = useState<string | null>("h1");
  const list = [...HOSPITALS].sort((a, b) => a.distanceKm - b.distanceKm);
  const shown = tab === "er" ? list.filter((h) => h.er) : list;
  const shareText = encodeURIComponent("I need urgent help. Please call an ambulance (108) to my location. I'm sharing my live location next.");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl bg-rescue-600 p-6 text-white shadow-lift sm:p-8">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide"><Siren className="h-5 w-5" aria-hidden /> Emergency Assistance</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">If this is serious or life-threatening, call 108 or 112 now.</h1>
        <p className="mt-2 max-w-2xl text-rescue-50">If you are experiencing a serious or life-threatening emergency, seek immediate medical attention or contact your local emergency services. MediWay cannot diagnose emergencies.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="tel:108" className="inline-flex h-14 items-center gap-2 rounded-xl bg-white px-6 text-lg font-extrabold text-rescue-700"><Phone className="h-5 w-5" /> Call 108 Ambulance</a>
          <a href="tel:112" className="inline-flex h-14 items-center gap-2 rounded-xl border-2 border-white px-6 text-lg font-bold text-white"><Phone className="h-5 w-5" /> Call 112</a>
          <Link href="/first-aid" className="inline-flex h-14 items-center gap-2 rounded-xl bg-rescue-800/60 px-6 text-base font-bold text-white hover:bg-rescue-800"><HeartPulse className="h-5 w-5" /> First aid until help arrives</Link>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist">
        {tabs.map((t) => <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Chip>)}
      </div>

      {tab === "contact" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {EMERGENCY_CONTACTS.map((c) => (
            <Card key={c.label} className="flex items-center justify-between gap-4 p-5">
              <div><p className="font-bold">{c.label}</p><p className="text-sm text-slate-600">{c.note}</p></div>
              <a href={`tel:${c.number}`} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-rescue-600 px-4 font-bold text-white hover:bg-rescue-700"><Phone className="h-4 w-4" />{"display" in c && c.display ? c.display : c.number}</a>
            </Card>
          ))}
          <Card className="p-5 md:col-span-2">
            <p className="font-bold">Send your location to someone</p>
            <p className="mb-3 text-sm text-slate-600">Ask a family member or neighbour to call 108 and meet the ambulance.</p>
            <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-ok-500 px-5 font-semibold text-white hover:bg-ok-600"><Share2 className="h-4 w-4" /> Share via WhatsApp</a>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-3">
            {shown.map((h) => (
              <Card key={h.id} className={cn("p-5", sel === h.id && "ring-2 ring-rescue-200 border-rescue-300")}>
                <button className="w-full text-left" onClick={() => setSel(h.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div><h2 className="text-lg font-bold">{h.name}</h2><p className="flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-4 w-4" aria-hidden /> {h.address}</p></div>
                    <span className="tnum shrink-0 font-display text-xl font-extrabold text-rescue-600">{h.distanceKm} km</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge tone="red">Emergency dept. 24x7</Badge><Badge tone="blue">{h.trauma}</Badge><Badge tone={h.beds === "Beds available" ? "green" : "amber"}>{h.beds}</Badge></div>
                  <p className="mt-2 text-sm text-slate-600">{h.note}</p>
                </button>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a href={`tel:${h.phone.replace(/\s/g, "")}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-brand-200 font-semibold text-brand-700 hover:bg-brand-50"><Phone className="h-4 w-4" /> {h.phone}</a>
                  <a href={mapsDirections(`${h.name}, ${h.address}`)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rescue-600 font-semibold text-white hover:bg-rescue-700"><Navigation className="h-4 w-4" /> Get Directions</a>
                </div>
              </Card>
            ))}
            <p className="text-xs text-slate-500">Hospital names and numbers are fictional sample data. Replace with a verified source before real use.</p>
          </div>
          <div className="lg:col-span-2"><MapPanel className="h-72 lg:sticky lg:top-24 lg:h-[28rem]" items={shown.map((h) => ({ id: h.id, label: h.name, x: h.x, y: h.y, kind: "hospital" as const }))} selected={sel} onSelect={setSel} /></div>
        </div>
      )}

      <p className="text-center text-sm text-slate-600">Nobody nearby, or the clinic is closed? <ButtonLink href="/first-aid" variant="ghost" size="sm">Open first aid guide</ButtonLink></p>
    </div>
  );
}
