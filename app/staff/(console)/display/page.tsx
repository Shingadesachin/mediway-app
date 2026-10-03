"use client";
import { doctorStatus, queueOf } from "@/components/staff/parts";
import { LogoMark } from "@/components/Logo";
import { doctorsOf, getClinic } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import { fmtTime, toISO } from "@/lib/utils";

/** Full-screen board for the waiting-room TV. Shows tokens only, never names or phone numbers. */
export default function Display() {
  const { state, now } = useStaff();
  const clinic = getClinic(state.user.clinicId!), today = toISO(now);
  return (
    <div className="min-h-screen bg-ink p-6 text-white sm:p-10">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-3"><LogoMark size={44} /><span><span className="block font-display text-2xl font-extrabold">{clinic.name}</span><span className="text-brand-200">Now serving</span></span></span>
        <span className="tnum font-display text-4xl font-extrabold">{now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>
      </header>
      {state.settings.notice && <p className="mt-6 rounded-2xl bg-amber-500 px-6 py-4 text-xl font-semibold">{state.settings.notice}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {doctorsOf(clinic.id).map((d) => {
          const st = doctorStatus(state, d, now), q = queueOf(state, d.id, today), cur = q.find((a) => a.status === "now-serving"), next = q.filter((a) => a.status !== "now-serving").slice(0, 4);
          return (
            <section key={d.id} className="rounded-3xl bg-white/10 p-8">
              <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{d.name}</h2><span className={`rounded-full px-4 py-1 text-sm font-bold ${st.key === "away" ? "bg-rescue-600" : st.key === "on" ? "bg-ok-600" : "bg-slate-500"}`}>{st.label}</span></div>
              <p className="text-brand-200">{d.specialty}</p>
              <p className="tnum mt-6 font-display text-7xl font-extrabold leading-none sm:text-8xl">{st.key === "away" ? "—" : cur?.token ?? "—"}</p>
              {st.key === "away" && <p className="mt-3 text-lg text-amber-200">Doctor has been called away. You will be messaged with your new time.</p>}
              <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-brand-200">Next in line</p>
              <div className="mt-2 flex flex-wrap gap-3">{next.length ? next.map((a) => <span key={a.id} className="tnum rounded-xl bg-white/15 px-4 py-2 font-display text-2xl font-bold">{a.token} <span className="text-sm font-medium text-brand-200">{fmtTime(a.time)}</span></span>) : <span className="text-brand-200">No one waiting</span>}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
