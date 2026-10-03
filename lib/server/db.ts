import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

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
export function getDb(): DB {
  const g = globalThis as unknown as { __mwdb?: DB };
  if (g.__mwdb) return g.__mwdb;
  const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "mediway.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.exec(SCHEMA);
  g.__mwdb = db;
  const { seedIfEmpty } = require("./seed") as typeof import("./seed");
  seedIfEmpty(db);
  return db;
}
