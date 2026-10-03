"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CLINICS, doctorsOf } from "@/lib/data";
import { doctorLive, isClinicOpen, urgentScore } from "@/lib/engine";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Live wait-time board, styled like a departures screen. Waits drift every few seconds in the prototype. */
export function WaitBoard({ limit = 5, className }: { limit?: number; className?: string }) {
  const { waits, ctx } = useApp();
  const rows = CLINICS.filter((c) => c.urgent && isClinicOpen(c, ctx.now))
    .map((c) => ({ c, w: waits[c.id] ?? c.baseWait, free: doctorsOf(c.id).filter((d) => doctorLive(d, ctx).key === "now").length }))
    .sort((a, b) => b.c.rating * 0 + (urgentScore(b.c, b.w) - urgentScore(a.c, a.w)))
    .slice(0, limit);
  return (
    <section aria-label="Live urgent care wait times" className={cn("overflow-hidden rounded-3xl bg-ink text-white shadow-lift", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-bold">Urgent care right now</h2>
        <span className="flex items-center gap-2 text-sm text-aqua-200">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-aqua-400 animate-ping2" /><span className="relative h-2.5 w-2.5 rounded-full bg-aqua-400" /></span>
          Live
        </span>
      </div>
      <ul>
        {rows.length === 0 && <li className="px-5 py-8 text-center text-sm text-brand-200">No urgent care clinics are open right now. See the first aid guide.</li>}
        {rows.map(({ c, w, free }) => (
          <li key={c.id} className="border-b border-white/10 last:border-0">
            <Link href={`/book?clinic=${c.id}&urgent=1`} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5">
              <div className="w-16 shrink-0 text-center">
                <p className={cn("tnum font-display text-3xl font-extrabold leading-none", w <= 15 ? "text-ok-100" : w <= 30 ? "text-amber-100" : "text-rescue-200")}>{w}</p>
                <p className="text-[11px] text-brand-200">min wait</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="truncate text-sm text-brand-200">{c.area}, {c.distanceKm} km, {free} {free === 1 ? "doctor" : "doctors"} free now</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-brand-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
