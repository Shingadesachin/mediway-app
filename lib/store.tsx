"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { slotKey, Ctx, slotTimes } from "./engine";
import { DOCTORS } from "./data";
import type { Appointment, Busy, Msg, Notif, NotifPrefs, PatientState, User } from "./types";
import { clinicNow, toMin, uid } from "./utils";

export type { Appointment, Msg, Notif, NotifPrefs, User } from "./types";
export type ApptStatus = Appointment["status"];
export interface Toast { id: string; type: "success" | "info" | "warn" | "error"; title: string; body?: string }
type Result = { ok: boolean; error?: string };

interface AppValue {
  ready: boolean; offline: boolean; now: Date; ctx: Ctx; user: User | null; prefs: NotifPrefs;
  appointments: Appointment[]; allAppointments: Busy[]; notifications: Notif[]; messages: Msg[];
  emergencies: Record<string, number>; savedDoctors: string[]; savedClinics: string[]; waits: Record<string, number>; notices: Record<string, string>; unread: number;
  toasts: Toast[]; dismissToast: (id: string) => void; toast: (t: Omit<Toast, "id">) => void;
  login: (identifier: string, password: string) => Promise<Result>;
  signup: (p: { name: string; phone: string; email: string; password: string }) => Promise<Result>;
  guest: () => Promise<Result>; logout: () => Promise<void>; refresh: () => Promise<void>;
  updateUser: (p: Partial<User>) => Promise<void>; setPrefs: (p: Partial<NotifPrefs>) => Promise<void>;
  book: (p: { doctorId: string; date: string; time: string; reason: string; urgent: boolean; phone: string; patient: string }) => Promise<Appointment>;
  reschedule: (id: string, date: string, time: string) => Promise<void>; cancel: (id: string) => Promise<void>; acceptShift: (id: string) => Promise<void>;
  markRead: (id: string) => Promise<void>; markAllRead: () => Promise<void>; toggleDoctor: (id: string) => Promise<void>; toggleClinic: (id: string) => Promise<void>;
}
const Ctx_ = createContext<AppValue | null>(null);
export const useApp = () => {
  const v = useContext(Ctx_);
  if (!v) throw new Error("useApp outside provider");
  return v;
};

async function call(url: string, body?: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PatientState | null>(null);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState<Date>(() => clinicNow());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Set<string> | null>(null);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((x) => [...x.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 6500);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((x) => x.filter((y) => y.id !== id)), []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const s: PatientState = await r.json();
      setOffline(false);
      setState(s);
      setNow(clinicNow());
      const ids = new Set(s.notifications.map((n) => n.id));
      if (seen.current) {
        for (const n of s.notifications) if (!seen.current.has(n.id) && !n.read) toast({ type: /postpone|moved/i.test(n.title) ? "warn" : "info", title: n.title, body: n.body });
      }
      seen.current = ids;
    } catch {
      setOffline(true);
      setState((x) => x ?? ({ serverTime: Date.now(), user: null, prefs: { sms: true, whatsapp: true, reminders: true, email: false }, appointments: [], busy: [], blocks: [], notifications: [], messages: [], savedDoctors: [], savedClinics: [], emergencies: {}, waits: {}, notices: {} } as PatientState));
    }
  }, [toast]);

  useEffect(() => {
    refresh();
    const poll = setInterval(() => { if (!document.hidden) refresh(); }, 8000);
    const tick = setInterval(() => setNow(clinicNow()), 15000);
    const vis = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(poll); clearInterval(tick); document.removeEventListener("visibilitychange", vis); };
  }, [refresh]);

  const act = useCallback(async (type: string, payload: Record<string, unknown> = {}, quiet = false) => {
    try {
      const j = await call("/api/action", { type, ...payload });
      await refresh();
      return j;
    } catch (e) {
      if (!quiet) toast({ type: "error", title: "Couldn't complete that", body: (e as Error).message });
      await refresh();
      throw e;
    }
  }, [refresh, toast]);

  const value: AppValue | null = useMemo(() => {
    if (!state) return null;
    const booked = new Set<string>(state.busy.map((b) => slotKey(b.doctorId, b.date, b.time)));
    for (const b of state.blocks) {
      const doc = DOCTORS.find((d) => d.id === b.doctorId);
      if (doc) for (const t of slotTimes(doc)) if (toMin(t) >= b.from && toMin(t) < b.to) booked.add(slotKey(b.doctorId, b.date, t));
    }
    const ctx: Ctx = { now, booked, emergencies: state.emergencies };
    const guarded = (fn: () => Promise<unknown>) => async () => { try { await fn(); } catch {} };
    return {
      ready: true, offline, now, ctx, user: state.user, prefs: state.prefs, appointments: state.appointments, allAppointments: state.busy,
      notifications: state.notifications, messages: state.messages, emergencies: state.emergencies, savedDoctors: state.savedDoctors, savedClinics: state.savedClinics,
      waits: state.waits, notices: state.notices, unread: state.notifications.filter((n) => !n.read).length, toasts, dismissToast, toast, refresh,

      login: async (identifier, password) => {
        try { await call("/api/auth/login", { identifier, password, portal: "patient" }); await refresh(); return { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; }
      },
      signup: async (p) => { try { await call("/api/auth/signup", p); await refresh(); return { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; } },
      guest: async () => { try { await call("/api/auth/guest"); await refresh(); return { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; } },
      logout: async () => { try { await call("/api/auth/logout"); } catch {} seen.current = null; setState(null); await refresh(); },
      updateUser: async (p) => { await guarded(() => act("profile", { ...state.user, ...p }))(); },
      setPrefs: async (p) => { await guarded(() => act("prefs", p))(); },
      book: async (p) => {
        const j = await act("book", p);
        toast({ type: "success", title: "Appointment confirmed", body: `Token ${j.appointment.token}. Details sent by SMS and WhatsApp.` });
        return j.appointment as Appointment;
      },
      reschedule: async (id, date, time) => { await act("reschedule", { id, date, time }); toast({ type: "success", title: "Appointment rescheduled", body: "We've sent you the new time." }); },
      cancel: async (id) => { await guarded(() => act("cancel", { id }))(); toast({ type: "info", title: "Appointment cancelled" }); },
      acceptShift: async (id) => { await guarded(() => act("accept", { id }))(); toast({ type: "success", title: "New time accepted" }); },
      markRead: async (id) => { await guarded(() => act("read", { id }, true))(); },
      markAllRead: async () => { await guarded(() => act("read", {}, true))(); },
      toggleDoctor: async (id) => { await guarded(() => act("save", { kind: "doctor", id }, true))(); },
      toggleClinic: async (id) => { await guarded(() => act("save", { kind: "clinic", id }, true))(); },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, now, toasts, offline, act, refresh, toast, dismissToast]);

  if (!value) return <div className="grid min-h-screen place-items-center text-sm text-brand-700" role="status" aria-live="polite">Loading MediWay...</div>;
  return <Ctx_.Provider value={value}>{children}</Ctx_.Provider>;
}
