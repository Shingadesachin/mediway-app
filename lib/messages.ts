import { Clinic, Doctor } from "./data";
import { dayLabel, fmtTime } from "./utils";

interface A { token: string; date: string; time: string; prevTime?: string; prevDate?: string }
const when = (a: A, now: Date) => `${dayLabel(a.date, now)} at ${fmtTime(a.time)}`;

export const confirmSms = (a: A, d: Doctor, c: Clinic, now: Date, wait: number) =>
  `MediWay: Appointment confirmed. Token ${a.token}. ${d.name}, ${c.name}, ${when(a, now)}. Expected wait about ${wait} min. Reply CANCEL to cancel.`;

export const confirmWa = (a: A, d: Doctor, c: Clinic, now: Date, wait: number) =>
  `✅ *Appointment confirmed*\n\n🎟️ Token: *${a.token}*\n👩‍⚕️ ${d.name} (${d.specialty})\n🏥 ${c.name}\n📍 ${c.address}\n🗓️ ${when(a, now)}\n⏱️ Expected wait: about ${wait} min\n\nWe will message you before your turn. Reply *RESCHEDULE* to change the time.`;

export const reminderSms = (a: A, d: Doctor, c: Clinic, mins: number) =>
  `MediWay reminder: Token ${a.token} with ${d.name} at ${c.name} starts in about ${mins} min (${fmtTime(a.time)}). Please arrive 10 minutes early.`;

export const postponedSms = (a: A, d: Doctor, now: Date) =>
  `MediWay: ${d.name} was called away for an emergency. Token ${a.token} moved from ${fmtTime(a.prevTime || a.time)} to ${when(a, now)}. Reply 1 to accept or 2 to pick another time.`;

export const postponedWa = (a: A, d: Doctor, c: Clinic, now: Date) =>
  `⚠️ *Your appointment has been postponed*\n\n${d.name} has been called away to attend an emergency.\n\n🎟️ Token: *${a.token}*\n🕓 Was: ${fmtTime(a.prevTime || a.time)}\n🕗 Now: *${when(a, now)}*\n🏥 ${c.name}\n\nReply *1* to accept the new time, or *2* to choose another time.`;

export const cancelSms = (a: A, d: Doctor) => `MediWay: Token ${a.token} with ${d.name} has been cancelled. Book again anytime at mediway.app.`;
export const rescheduleSms = (a: A, d: Doctor, now: Date) => `MediWay: Token ${a.token} with ${d.name} is now ${when(a, now)}.`;
export const turnSms = (a: A, d: Doctor) => `MediWay: It is your turn. Please go to ${d.name}'s room now. Token ${a.token}.`;
export const nextSms = (a: A, d: Doctor) => `MediWay: You are next in line for ${d.name}. Token ${a.token}. Please be at the clinic.`;

export const movedSms = (a: A, from: Doctor, to: Doctor, now: Date) =>
  `MediWay: ${from.name} was called away for an emergency. Token ${a.token} now sees ${to.name}, ${when(a, now)} (was ${fmtTime(a.prevTime || a.time)}). Reply 2 if you prefer another time.`;

export const movedWa = (a: A, from: Doctor, to: Doctor, c: Clinic, now: Date) =>
  `⚠️ *Your appointment was moved*\n\n${from.name} has been called away to attend an emergency, so you will see *${to.name}* instead.\n\n🎟️ Token: *${a.token}*\n🕓 Was: ${fmtTime(a.prevTime || a.time)}\n🕗 Now: *${when(a, now)}*\n🏥 ${c.name}\n\nReply *2* if you would like to choose another time.`;

export const noShowSms = (a: A, c: Clinic) =>
  `MediWay: Token ${a.token} at ${c.name} was marked as missed. Call ${c.phone} or book again at mediway.app.`;

export const broadcastSms = (c: Clinic, text: string) => `MediWay, ${c.name}: ${text}`;
export const broadcastWa = (c: Clinic, text: string) => `📢 *${c.name}*\n\n${text}`;
