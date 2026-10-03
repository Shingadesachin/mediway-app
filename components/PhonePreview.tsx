import { MessageCircle, MessageSquare } from "lucide-react";
import { Msg } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Shows a message as it would appear on the patient's phone. */
export function Bubble({ m }: { m: Pick<Msg, "channel" | "body" | "time"> }) {
  const wa = m.channel === "WhatsApp";
  return (
    <div className={cn("rounded-2xl p-3", wa ? "bg-[#DCF8C6]" : "bg-slate-100")}>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-600">
        {wa ? <MessageCircle className="h-3.5 w-3.5 text-ok-600" aria-hidden /> : <MessageSquare className="h-3.5 w-3.5" aria-hidden />} {m.channel}
      </p>
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">{m.body}</p>
      <p className="mt-1 text-right text-[11px] text-slate-500">{new Date(m.time).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p>
    </div>
  );
}
