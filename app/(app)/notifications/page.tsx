"use client";
import Link from "next/link";
import { useState } from "react";
import { Bell, CalendarCheck, CalendarClock, CalendarX, CheckCheck, Megaphone, Ticket } from "lucide-react";
import { Bubble } from "@/components/PhonePreview";
import { Button, Card, EmptyState, PageHeader, Segmented } from "@/components/ui";
import { useApp } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";

const icons = { confirmed: CalendarCheck, reminder: Bell, rescheduled: CalendarClock, cancelled: CalendarX, update: Megaphone, queue: Ticket };
const tones = { confirmed: "bg-ok-50 text-ok-600", reminder: "bg-brand-50 text-brand-600", rescheduled: "bg-amber-50 text-amber-600", cancelled: "bg-rescue-50 text-rescue-600", update: "bg-aqua-50 text-aqua-700", queue: "bg-brand-50 text-brand-600" };

export default function Notifications() {
  const { notifications, messages, markRead, markAllRead, unread, now } = useApp();
  const [tab, setTab] = useState<"all" | "messages">("all");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifications" sub="Updates about your appointments, and the messages we sent to your phone."
        right={unread > 0 ? <Button size="sm" variant="secondary" onClick={markAllRead}><CheckCheck className="h-4 w-4" /> Mark all read</Button> : undefined} />
      <Segmented value={tab} onChange={setTab} options={[{ value: "all", label: `All (${notifications.length})` }, { value: "messages", label: `SMS & WhatsApp (${messages.length})` }]} />
      <div className="mt-5 space-y-3">
        {tab === "all" && (notifications.length === 0
          ? <EmptyState icon={<Bell className="h-6 w-6" />} title="You're all caught up" body="Booking confirmations, reminders and doctor updates show up here." />
          : notifications.map((n) => {
              const Icon = icons[n.type];
              const inner = (
                <div className={cn("flex gap-3 rounded-2xl border p-4 transition-colors", n.read ? "border-brand-100 bg-white" : "border-brand-300 bg-brand-50/60")}>
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", tones[n.type])}><Icon className="h-5 w-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2"><p className="font-bold">{n.title}</p><span className="shrink-0 text-xs text-slate-500">{timeAgo(n.time, now.getTime())}</span></div>
                    <p className="text-sm text-slate-700">{n.body}</p>
                    {n.type === "rescheduled" && n.title.includes("postponed") && <p className="mt-1 text-sm font-semibold text-brand-700">Review your new time</p>}
                  </div>
                  {!n.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                </div>
              );
              return n.apptId ? <Link key={n.id} href="/appointments" onClick={() => markRead(n.id)} className="block">{inner}</Link> : <button key={n.id} onClick={() => markRead(n.id)} className="block w-full text-left">{inner}</button>;
            }))}
        {tab === "messages" && (messages.length === 0
          ? <EmptyState icon={<Bell className="h-6 w-6" />} title="No messages yet" body="When you book, we send your token by SMS and WhatsApp. Copies appear here." />
          : <>
              <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Messages are simulated in this demo. Add Twilio keys to send them to real phones.</p>
              {messages.map((m) => <Card key={m.id} className="p-3"><p className="mb-2 px-1 text-xs text-slate-500">To {m.to || "your number"}</p><Bubble m={m} /></Card>)}
            </>)}
      </div>
    </div>
  );
}
