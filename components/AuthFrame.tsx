import { Logo } from "./Logo";
import { Siren } from "lucide-react";
import Link from "next/link";

export function AuthFrame({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between"><Logo /><Link href="/emergency" className="inline-flex h-10 items-center gap-2 rounded-xl bg-rescue-600 px-3.5 text-sm font-bold text-white"><Siren className="h-4 w-4" /> Emergency Help</Link></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-slate-600">{sub}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-aqua-600/30 blur-3xl" />
        <p className="relative max-w-md font-display text-4xl font-extrabold leading-tight">Smart Care. Less Waiting.</p>
        <p className="relative mt-3 max-w-md text-brand-200">See which doctors are free now, get a token, and get updates on WhatsApp.</p>
      </div>
    </div>
  );
}
