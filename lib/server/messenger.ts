import { normPhone } from "../utils";

export type DeliveryStatus = "sent" | "simulated" | "failed";
export const twilioConfigured = () =>
  !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM);

/** Sends through Twilio when configured. Otherwise reports "simulated" (the message is still logged in the app). */
export async function deliver(channel: "SMS" | "WhatsApp", to: string, body: string): Promise<DeliveryStatus> {
  const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN;
  const from = channel === "SMS" ? process.env.TWILIO_SMS_FROM : process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !tok || !from) return "simulated";
  const addr = normPhone(to);
  const To = channel === "WhatsApp" ? `whatsapp:${addr}` : addr;
  const From = channel === "WhatsApp" && !from.startsWith("whatsapp:") ? `whatsapp:${from}` : from;
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${sid}:${tok}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To, From, Body: body }),
    });
    return r.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
