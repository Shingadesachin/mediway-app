"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/find-doctor", label: "Doctors" },
  { href: "/clinics", label: "Clinics" },
  { href: "/urgent-care", label: "Urgent care" },
  { href: "/recommendations", label: "AI match" },
];
export function FindTabs() {
  const p = usePathname();
  return (
    <div className="no-scrollbar mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-brand-100/70 p-1" role="tablist" aria-label="Find care">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} role="tab" aria-selected={p === t.href} className={cn("h-9 shrink-0 rounded-lg px-4 text-sm font-semibold leading-9 transition-colors", p === t.href ? "bg-white text-brand-700 shadow-sm" : "text-brand-700/70 hover:text-brand-700")}>{t.label}</Link>
      ))}
    </div>
  );
}
