import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";
import { normPhone } from "../utils";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, role TEXT NOT NULL DEFAULT 'patient', name TEXT NOT NULL, email TEXT, phone TEXT, phone_norm TEXT,
  password_hash TEXT, age TEXT DEFAULT '', location TEXT DEFAULT '', specialties TEXT DEFAULT '[]', clinic_id TEXT,
  prefs TEXT DEFAULT '{"sms":true,"whatsapp":true,"reminders":true,"email":false}', is_guest INTEGER DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_email ON users(lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_phone ON users(phone_norm) WHERE phone_norm IS NOT NULL AND phone_norm <> '' AND is_guest = 0;
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY, token TEXT NOT NULL, clinic_id TEXT NOT NULL, doctor_id TEXT NOT NULL, user_id TEXT,
  patient_name TEXT NOT NULL, phone TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, reason TEXT DEFAULT '',
  urgent INTEGER DEFAULT 0, status TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'online', is_demo INTEGER DEFAULT 0,
  prev_date TEXT, prev_time TEXT, reminded INTEGER DEFAULT 0, created_at INTEGER NOT NULL, started_at INTEGER, completed_at INTEGER, wait_min INTEGER
);
CREATE INDEX IF NOT EXISTS ix_appt_clinic_date ON appointments(clinic_id, date);
CREATE INDEX IF NOT EXISTS ix_appt_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS ix_appt_doc_date ON appointments(doctor_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_slot ON appointments(doctor_id, date, time)
  WHERE status IN ('confirmed','postponed','now-serving') AND source = 'online';
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
  time INTEGER NOT NULL, read INTEGER DEFAULT 0, appt_id TEXT
);
CREATE INDEX IF NOT EXISTS ix_notif_user ON notifications(user_id, time);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, user_id TEXT, clinic_id TEXT NOT NULL, channel TEXT NOT NULL, to_phone TEXT NOT NULL, name TEXT,
  body TEXT NOT NULL, time INTEGER NOT NULL, appt_id TEXT, status TEXT NOT NULL, kind TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_msg_clinic ON messages(clinic_id, time);
CREATE INDEX IF NOT EXISTS ix_msg_user ON messages(user_id, time);
CREATE TABLE IF NOT EXISTS doctor_status (doctor_id TEXT PRIMARY KEY, away_since INTEGER, away_reason TEXT, eta_min INTEGER);
CREATE TABLE IF NOT EXISTS blocks (id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL, date TEXT NOT NULL, from_min INTEGER NOT NULL, to_min INTEGER NOT NULL, reason TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS clinic_settings (clinic_id TEXT PRIMARY KEY, walkins INTEGER DEFAULT 1, delay_min INTEGER DEFAULT 0, reminder_min INTEGER DEFAULT 60, notice TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS saved (user_id TEXT NOT NULL, kind TEXT NOT NULL, ref_id TEXT NOT NULL, PRIMARY KEY (user_id, kind, ref_id));
CREATE TABLE IF NOT EXISTS token_seq (clinic_id TEXT NOT NULL, date TEXT NOT NULL, seq INTEGER NOT NULL, PRIMARY KEY (clinic_id, date));
CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, staff_name TEXT, action TEXT NOT NULL, detail TEXT, time INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS ix_audit_clinic ON audit(clinic_id, time);
`;

type DB = Database.Database;

function migrate(db: DB) {
  let version = Number(db.pragma("user_version", { simple: true }));
  if (version < 1) {
    db.transaction(() => {
      db.exec(`CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL, used_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS ix_password_resets_user ON password_resets(user_id, expires_at);`);
      const users = db.prepare("SELECT id, phone, phone_norm FROM users WHERE phone IS NOT NULL AND phone <> ''").all() as
        { id: string; phone: string; phone_norm: string | null }[];
      const update = db.prepare("UPDATE users SET phone=?, phone_norm=? WHERE id=?");
      for (const user of users) {
        const phone = normPhone(user.phone);
        if (phone) update.run(phone, phone, user.id);
        else if (user.phone_norm && /^\d{10}$/.test(user.phone_norm)) update.run(user.phone, null, user.id);
      }
      const appointments = db.prepare("SELECT id, phone FROM appointments WHERE phone <> ''").all() as
        { id: string; phone: string }[];
      const updateAppointment = db.prepare("UPDATE appointments SET phone=? WHERE id=?");
      for (const appointment of appointments) {
        const phone = normPhone(appointment.phone);
        if (phone) updateAppointment.run(phone, appointment.id);
      }
      db.pragma("user_version = 1");
    })();
    version = 1;
  }
  if (version < 2) {
    db.transaction(() => {
      const userColumns = new Set((db.pragma("table_info(users)") as { name: string }[]).map((column) => column.name));
      if (!userColumns.has("doctor_id")) db.exec("ALTER TABLE users ADD COLUMN doctor_id TEXT");
      if (!userColumns.has("must_change_password")) db.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0");
      db.exec(`
        CREATE TABLE IF NOT EXISTS clinics (
          id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL, area TEXT NOT NULL, address TEXT NOT NULL,
          lat REAL NOT NULL, lng REAL NOT NULL, rating REAL NOT NULL DEFAULT 0, reviews INTEGER NOT NULL DEFAULT 0,
          open_json TEXT NOT NULL, urgent INTEGER NOT NULL DEFAULT 0, base_wait INTEGER NOT NULL DEFAULT 0,
          phone TEXT NOT NULL DEFAULT '', services_json TEXT NOT NULL DEFAULT '[]', blurb TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'active'
        );
        CREATE TABLE IF NOT EXISTS doctors (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, specialty TEXT NOT NULL, clinic_id TEXT NOT NULL,
          rating REAL NOT NULL DEFAULT 0, reviews INTEGER NOT NULL DEFAULT 0, exp INTEGER NOT NULL DEFAULT 0,
          fee INTEGER NOT NULL DEFAULT 0, shift_start INTEGER NOT NULL, shift_end INTEGER NOT NULL,
          avg_consult INTEGER NOT NULL DEFAULT 12, languages_json TEXT NOT NULL DEFAULT '[]',
          about TEXT NOT NULL DEFAULT '', treats_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'active'
        );
        CREATE INDEX IF NOT EXISTS ix_doctors_clinic_status ON doctors(clinic_id,status);
        CREATE TABLE IF NOT EXISTS clinic_applications (
          id TEXT PRIMARY KEY, clinic_name TEXT NOT NULL, address TEXT NOT NULL, area TEXT NOT NULL,
          lat REAL NOT NULL, lng REAL NOT NULL, phone TEXT NOT NULL, opening_hours TEXT NOT NULL,
          services_json TEXT NOT NULL, contact_name TEXT NOT NULL, contact_email TEXT NOT NULL,
          password_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL,
          reviewed_at INTEGER, reviewed_by TEXT, rejection_reason TEXT
        );
        CREATE INDEX IF NOT EXISTS ix_clinic_applications_status ON clinic_applications(status,created_at);
      `);
      db.pragma("user_version = 2");
    })();
    version = 2;
  }
  if (version < 3) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, endpoint TEXT NOT NULL UNIQUE,
          keys_json TEXT NOT NULL, created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS ix_push_subscriptions_user ON push_subscriptions(user_id);
        CREATE TABLE IF NOT EXISTS staff_notifications (
          id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, doctor_id TEXT, type TEXT NOT NULL,
          title TEXT NOT NULL, body TEXT NOT NULL, time INTEGER NOT NULL, read INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS ix_staff_notifications_clinic ON staff_notifications(clinic_id,time);
      `);
      db.pragma("user_version = 3");
    })();
  }
}

export function getDb(): DB {
  const g = globalThis as unknown as { __mwdb?: DB };
  if (g.__mwdb) return g.__mwdb;
  // Vercel only allows writing to the temporary folder. Locally (and on Railway/Fly/VPS) we use ./data or DATA_DIR.
  const dir = process.env.DATA_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), "mediway") : path.join(process.cwd(), "data"));
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "mediway.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.exec(SCHEMA);
  migrate(db);
  g.__mwdb = db;
  const { seedIfEmpty } = require("./seed") as typeof import("./seed");
  seedIfEmpty(db);
  return db;
}
