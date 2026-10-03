import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { acceptShift, cancel, mapAppt } from "@/lib/server/service";
import { clinicNow, toISO } from "@/lib/utils";

export const dynamic = "force-dynamic";
const xml = (t: string) => new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${t.replace(/[<&>]/g, "")}</Message></Response>`, { headers: { "Content-Type": "text/xml" } });

/** Twilio webhook for patient replies: 1 = accept new time, 2 = choose another, CANCEL = cancel. */
export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => (params[k] = String(v)));
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (token) {
    const url = process.env.TWILIO_WEBHOOK_URL || req.url;
    const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
    const sig = crypto.createHmac("sha1", token).update(data).digest("base64");
    const got = req.headers.get("x-twilio-signature") || "";
    if (got.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(sig))) return new NextResponse("Forbidden", { status: 403 });
  }
  const from = (params.From || "").replace(/\D/g, "").slice(-10), body = (params.Body || "").trim().toUpperCase();
  if (from.length < 10) return xml("Sorry, we could not read your number.");
  const rows = getDb().prepare(`SELECT * FROM appointments WHERE date>=? AND status IN ('confirmed','postponed') AND replace(replace(replace(phone,' ',''),'+',''),'-','') LIKE ? ORDER BY date, time`).all(toISO(clinicNow()), `%${from}`) as never[];
  const a = rows.length ? mapAppt(rows[0]) : null;
  if (!a) return xml("MediWay: We could not find an upcoming appointment for this number.");
  if (body === "1" && a.status === "postponed") { acceptShift(a); return xml(`MediWay: Thanks. Token ${a.token} is confirmed for ${a.time} on ${a.date}.`); }
  if (body === "CANCEL") { cancel(a, "patient"); return xml(`MediWay: Token ${a.token} has been cancelled.`); }
  if (body === "2" || body === "RESCHEDULE") return xml("MediWay: Open mediway.app/appointments to choose another time, or call the clinic.");
  return xml("MediWay: Reply 1 to accept a new time, 2 to choose another time, or CANCEL to cancel.");
}
