"use client";
import { useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { StaffState } from "./types";
import { clinicNow, uid } from "./utils";

export interface StaffToast { id: string; type: "success" | "error" | "info"; text: string }
interface V {
  state: StaffState; now: Date; toasts: StaffToast[]; toast: (type: StaffToast["type"], text: string) => void;
  act: <T = Record<string, unknown>>(type: string, payload?: Record<string, unknown>) => Promise<T>;
  refresh: () => Promise<void>; logout: () => Promise<void>;
}
const C = createContext<V | null>(null);
export const useStaff = () => {
  const v = useContext(C);
  if (!v) throw new Error("useStaff outside provider");
  return v;
};

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<StaffState | null>(null);
  const [now, setNow] = useState(() => clinicNow());
  const [toasts, setToasts] = useState<StaffToast[]>([]);
  const [lost, setLost] = useState(false);
  const alive = useRef(true);

  const toast = useCallback((type: StaffToast["type"], text: string) => {
    const id = uid();
    setToasts((x) => [...x.slice(-3), { id, type, text }]);
    setTimeout(() => setToasts((x) => x.filter((t) => t.id !== id)), 6000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/staff/state", { cache: "no-store" });
      if (r.status === 401 || r.status === 403) { router.replace("/staff/login"); return; }
      if (!r.ok) throw new Error();
      if (alive.current) { setState(await r.json()); setNow(clinicNow()); setLost(false); }
    } catch { if (alive.current) setLost(true); }
  }, [router]);

  useEffect(() => {
    alive.current = true;
    refresh();
    const p = setInterval(() => { if (!document.hidden) refresh(); }, 5000);
    const t = setInterval(() => setNow(clinicNow()), 15000);
    return () => { alive.current = false; clearInterval(p); clearInterval(t); };
  }, [refresh]);

  const act = useCallback(async <T,>(type: string, payload: Record<string, unknown> = {}) => {
    const r = await fetch("/api/staff/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, ...payload }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { router.replace("/staff/login"); throw new Error("Session expired"); }
    if (!r.ok) { toast("error", j.error || "Something went wrong."); await refresh(); throw new Error(j.error); }
    await refresh();
    return j as T;
  }, [refresh, router, toast]);

  const logout = useCallback(async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/staff/login"); }, [router]);
  const value = useMemo(() => (state ? { state, now, toasts, toast, act, refresh, logout } : null), [state, now, toasts, toast, act, refresh, logout]);

  if (!value) return <div className="grid min-h-screen place-items-center text-sm text-slate-500" role="status">{lost ? "Can't reach the server. Retrying..." : "Loading clinic desk..."}</div>;
  return (
    <C.Provider value={value}>
      {lost && <div className="fixed inset-x-0 top-0 z-[60] bg-amber-500 py-1.5 text-center text-sm font-semibold text-white" role="alert">Connection lost. Showing the last known data. Retrying...</div>}
      {children}
      <div className="fixed bottom-4 right-4 z-[70] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`animate-rise rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lift ${t.type === "error" ? "bg-rescue-600" : t.type === "success" ? "bg-ok-600" : "bg-ink"}`}>{t.text}</div>
        ))}
      </div>
    </C.Provider>
  );
}
