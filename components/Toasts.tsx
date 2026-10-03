"use client";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  const icon = { success: CheckCircle2, info: Info, warn: AlertTriangle, error: XCircle } as const;
  const color = { success: "text-ok-500", info: "text-brand-500", warn: "text-amber-500", error: "text-rescue-500" } as const;
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[90] flex flex-col items-center gap-2 sm:left-auto sm:right-4 sm:top-4 sm:items-end" aria-live="polite">
      {toasts.map((t) => {
        const I = icon[t.type];
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-sheet items-start gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-lift">
            <I className={cn("mt-0.5 h-5 w-5 shrink-0", color[t.type])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-sm text-slate-600">{t.body}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
