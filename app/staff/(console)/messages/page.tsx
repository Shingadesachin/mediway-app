"use client";
import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, inputCls } from "@/components/ui";
import { doctorsOf } from "@/lib/data";
import { useStaff } from "@/lib/staff-store";
import { cn, timeAgo } from "@/lib/utils";

const TEMPLATES = ["The doctor is running about 20 minutes late. Thank you for your patience.", "We are seeing a high number of patients today. Expect an extra wait of 30 minutes.", "The clinic will close early today. Please call us if you need to reschedule."];
const tone = { sent: "green", simulated: "gray", queued: "blue", failed: "red" } as const;

export default function Messages() {
  const { state, now, act, toast } = useStaff();
  const docs = doctorsOf(state.user.clinicId!);
  const [text, setText] = useState("");
  const [doc, setDoc] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const counts = state.messages.reduce<Record<string, number>>((m, x) => ((m[x.status] = (m[x.status] || 0) + 1), m), {});
  const send = async () => {
    setBusy(true);
    try { const r = await act<{ sent: number }>("broadcast", { text, doctorId: doc || undefined }); toast("success", `Sent to ${r.sent} patient${r.sent === 1 ? "" : "s"} with appointments today.`); setText(""); } catch {} finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold sm:text-3xl">Messages</h1><p className="text-slate-600">Every SMS and WhatsApp sent for your clinic, plus broadcast to today's patients.</p></div>
      <div className={cn("rounded-2xl p-4 text-sm", state.twilio ? "bg-ok-50 text-ok-700" : "bg-amber-50 text-amber-700")}>
        {state.twilio ? "Twilio is connected. Messages are delivered to patients' phones." : <>Messages are <strong>simulated</strong>: they are logged here but not delivered. Add your Twilio keys to <code className="rounded bg-white/70 px-1">.env.local</code> and restart to send real SMS and WhatsApp messages.</>}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card className="h-fit p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Megaphone className="h-5 w-5 text-brand-600" /> Broadcast</h2>
          <p className="mb-3 text-sm text-slate-600">Message everyone with a pending appointment today.</p>
          <div className="space-y-3">
            <Field label="Send to"><select className={inputCls} value={doc} onChange={(e) => setDoc(e.target.value)}><option value="">All doctors' patients</option>{docs.map((d) => <option key={d.id} value={d.id}>Only {d.name}'s patients</option>)}</select></Field>
            <Field label="Message" hint={`${text.length}/300`}><textarea className={cn(inputCls, "h-28 py-3")} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a short update..." /></Field>
            <div className="flex flex-wrap gap-2">{TEMPLATES.map((t) => <button key={t} onClick={() => setText(t)} className="rounded-full border border-brand-200 px-3 py-1 text-left text-xs font-medium text-brand-700 hover:bg-brand-50">{t.slice(0, 38)}...</button>)}</div>
            <Button className="w-full" disabled={busy || text.trim().length < 5} onClick={send}><Send className="h-4 w-4" /> {busy ? "Sending..." : "Send broadcast"}</Button>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 px-5 py-3">
            <h2 className="text-lg font-bold">Message log</h2>
            <span className="flex gap-1.5">{Object.entries(counts).map(([k, v]) => <Badge key={k} tone={tone[k as keyof typeof tone]}>{v} {k}</Badge>)}</span>
          </div>
          {state.messages.length === 0 ? <EmptyState icon={<Send className="h-6 w-6" />} title="No messages yet" body="Messages appear here when patients book, are called, or a doctor is called away." /> : (
            <ul className="max-h-[640px] divide-y divide-brand-100 overflow-y-auto">
              {state.messages.map((m) => (
                <li key={m.id}>
                  <button onClick={() => setOpen(open === m.id ? null : m.id)} className="w-full px-5 py-3 text-left hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><Badge tone={m.channel === "WhatsApp" ? "green" : "blue"}>{m.channel}</Badge><strong>{m.name || m.to}</strong><span className="text-slate-500">{m.to}</span></span><span className="shrink-0 text-xs text-slate-500">{timeAgo(m.time, Date.now())}</span></div>
                    <div className="mt-1 flex items-center gap-2"><Badge tone={tone[m.status]}>{m.status}</Badge><span className="text-xs capitalize text-slate-500">{m.kind}</span></div>
                    <p className={cn("mt-1.5 whitespace-pre-line text-sm text-slate-700", open !== m.id && "line-clamp-2")}>{m.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <span className="hidden">{String(now)}</span>
    </div>
  );
}
