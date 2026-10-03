export type ApptStatus = "confirmed" | "now-serving" | "postponed" | "completed" | "cancelled" | "no-show";
export interface Appointment {
  id: string; token: string; userId?: string; patient: string; phone: string; doctorId: string; clinicId: string;
  date: string; time: string; reason: string; urgent: boolean; status: ApptStatus; source: "online" | "walk-in";
  prevDate?: string; prevTime?: string; createdAt: number; startedAt?: number; completedAt?: number; waitMin?: number;
}
/** Minimal public view of a booked slot. Contains no personal data. */
export interface Busy { id: string; doctorId: string; date: string; time: string; status: ApptStatus }
export interface Notif {
  id: string; type: "confirmed" | "reminder" | "rescheduled" | "cancelled" | "update" | "queue";
  title: string; body: string; time: number; read: boolean; apptId?: string;
}
export interface Msg {
  id: string; clinicId: string; channel: "SMS" | "WhatsApp"; to: string; name: string; body: string; time: number;
  apptId?: string; status: "queued" | "sent" | "simulated" | "failed"; kind: string;
}
export interface User {
  id: string; role: "patient" | "staff"; name: string; phone: string; email: string; age: string; location: string;
  guest?: boolean; specialties: string[]; clinicId?: string;
}
export interface NotifPrefs { sms: boolean; whatsapp: boolean; reminders: boolean; email: boolean }
export interface Block { id: string; doctorId: string; date: string; from: number; to: number; reason: string }

export interface PatientState {
  serverTime: number;
  user: User | null;
  prefs: NotifPrefs;
  appointments: Appointment[];
  busy: Busy[];
  blocks: Block[];
  notifications: Notif[];
  messages: Msg[];
  savedDoctors: string[];
  savedClinics: string[];
  emergencies: Record<string, number>;
  waits: Record<string, number>;
  notices: Record<string, string>;
}

export interface StaffDoctor { id: string; away: boolean; awaySince?: number; awayReason?: string; etaMin?: number }
export interface AuditRow { id: string; staffName: string; action: string; detail: string; time: number }
export interface ClinicSettings { walkins: boolean; delayMin: number; reminderMin: number; notice: string }
export interface StaffState {
  serverTime: number;
  user: User;
  settings: ClinicSettings;
  doctors: StaffDoctor[];
  appointments: Appointment[];
  messages: Msg[];
  audit: AuditRow[];
  blocks: Block[];
  wait: number;
  twilio: boolean;
}

export interface Analytics {
  days: number;
  today: { total: number; completed: number; waiting: number; nowServing: number; noShow: number; cancelled: number; walkIns: number; avgWait: number; messages: number; onDuty: number; doctors: number };
  period: { total: number; completed: number; noShow: number; cancelled: number; avgWait: number; walkIns: number; online: number; completionRate: number; noShowRate: number };
  prev: { total: number; avgWait: number; noShowRate: number };
  series: { date: string; label: string; total: number; completed: number; noShow: number; cancelled: number; avgWait: number }[];
  byHour: { hour: string; count: number }[];
  byDoctor: { id: string; name: string; specialty: string; total: number; completed: number; noShow: number; avgWait: number; fill: number }[];
  reasons: { reason: string; count: number }[];
  peakHour: string;
}
