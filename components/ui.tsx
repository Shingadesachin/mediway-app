"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { AlertTriangle, Check, RefreshCw, Star, X } from "lucide-react";
import { cn, hash } from "@/lib/utils";

type Variant = "primary" | "secondary" | "aqua" | "danger" | "ghost" | "success" | "dark";
type Size = "sm" | "md" | "lg";
export const btn = (variant: Variant = "primary", size: Size = "md", extra = "") =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-5 text-[15px]",
    size === "lg" && "h-14 px-7 text-base",
    variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
    variant === "secondary" && "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50",
    variant === "aqua" && "bg-aqua-500 text-white hover:bg-aqua-600",
    variant === "danger" && "bg-rescue-600 text-white hover:bg-rescue-700 shadow-sm",
    variant === "success" && "bg-ok-500 text-white hover:bg-ok-600",
    variant === "ghost" && "text-brand-700 hover:bg-brand-50",
    variant === "dark" && "bg-ink text-white hover:bg-brand-800",
    extra,
  );

export function Button({ variant, size, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button {...p} className={btn(variant, size, className)} />;
}
export function ButtonLink({ variant, size, className, href, ...p }: { variant?: Variant; size?: Size; className?: string; href: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return <Link href={href} {...p} className={btn(variant, size, className)} />;
}

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p} className={cn("rounded-2xl bg-white border border-brand-100 shadow-soft", className)} />
);

const tones = {
  blue: "bg-brand-50 text-brand-700 border-brand-100",
  aqua: "bg-aqua-50 text-aqua-700 border-aqua-100",
  green: "bg-ok-50 text-ok-700 border-ok-100",
  red: "bg-rescue-50 text-rescue-700 border-rescue-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  gray: "bg-slate-100 text-slate-600 border-slate-200",
};
export const Badge = ({ tone = "blue", className, children }: { tone?: keyof typeof tones; className?: string; children: React.ReactNode }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>
);

export const Rating = ({ value, count }: { value: number; count?: number }) => (
  <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
    <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden /> {value.toFixed(1)}
    {count !== undefined && <span className="font-normal text-slate-500">({count})</span>}
  </span>
);

const palette = ["bg-brand-600", "bg-aqua-600", "bg-brand-800", "bg-aqua-700", "bg-brand-500"];
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const ini = name.replace(/^Dr\.?\s*/i, "").split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full font-display font-bold text-white", palette[hash(name) % palette.length])} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {ini}
    </span>
  );
}

export const inputCls =
  "w-full h-12 rounded-xl border border-brand-200 bg-white px-4 text-[15px] text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";
export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rescue-600" role="alert">{error}</span>}
    </label>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("shrink-0 rounded-full border px-4 h-10 text-sm font-semibold transition-colors", active ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50")}>
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className={cn("relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift animate-sheet sm:rounded-3xl sm:p-7", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-brand-50"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rescue-200 bg-rescue-50 px-6 py-8 text-center" role="alert">
      <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-rescue-600" />
      <p className="font-semibold text-rescue-700">{message}</p>
      <Button variant="danger" className="mt-4" onClick={onRetry}><RefreshCw className="h-4 w-4" /> Try again</Button>
    </div>
  );
}
export const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded-xl bg-brand-100/70", className)} />;

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-slate-600">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Disclaimer({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
      <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children ?? "MediWay helps you choose a specialty and book a visit. It does not diagnose or replace a doctor."}</span>
    </p>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-ok-500" : "bg-slate-300")}>
      <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl bg-brand-100/70 p-1" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)} className={cn("h-9 rounded-lg px-4 text-sm font-semibold transition-colors", value === o.value ? "bg-white text-brand-700 shadow-sm" : "text-brand-700/70 hover:text-brand-700")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
