import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="11" fill="#0F52A8" />
      <path d="M16.5 9h7v7.5H31v7h-7.5V31h-7v-7.5H9v-7h7.5z" fill="#fff" />
      <path d="M8 33c7-1 10-6 12-13s6-11 12-12" fill="none" stroke="#2DBBC7" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="32" cy="8" r="3" fill="#2DBBC7" />
    </svg>
  );
}
export function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="MediWay home">
      <LogoMark />
      <span className="leading-none">
        <span className={cn("block font-display text-xl font-extrabold", light ? "text-white" : "text-ink")}>MediWay</span>
        <span className={cn("mt-0.5 block text-[11px] font-medium", light ? "text-brand-200" : "text-slate-500")}>Smart Care. Less Waiting.</span>
      </span>
    </Link>
  );
}
