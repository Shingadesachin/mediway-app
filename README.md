# MediWay: Smart Care. Less Waiting.

Two apps in one Next.js 14 project, backed by a real SQLite database and server-side login.

| App | URL | Who | Login |
|---|---|---|---|
| Patient app | `/` | Patients | `/login` |
| Clinic desk (MediWay for Clinics) | `/staff` | Reception and clinic staff | `/staff/login` |

Patients can never open `/staff` or its API. Staff are sent away from patient pages. This is enforced in
`middleware.ts` (page routes) and again in every API route (`requirePatient` / `requireStaff` in `lib/server/auth.ts`).

## Run
```bash
npm install        # also creates .env.local with a random SESSION_SECRET
npm run dev        # http://localhost:3000
```
Production: `npm run build && npm start`. Requires Node 18.18+ (Node 20 or 22 recommended).
The database is created in `./data/mediway.db` on first request and filled with demo data.
`npm run reset` deletes it so it is reseeded on the next start.

## Demo accounts
| Role | Login | Password |
|---|---|---|
| Patient | demo@mediway.app | demo1234 |
| Staff, Sunrise Family & Urgent Care | desk@mediway.app | desk1234 |
| Staff, HeartFirst Cardiac Clinic | heart@mediway.app | desk1234 |
| Staff, Medico 24x7 Urgent Care | night@mediway.app | desk1234 |

Each staff account is bound to one clinic and can only see and change that clinic's data.

## Try the main flow
1. Open `/staff/login` in one browser window, sign in as `desk@mediway.app`.
2. Open `/login` in a private window, sign in as `demo@mediway.app`, and book Dr. Rahul Sharma for today.
3. In the staff window go to Live queue, press "Called away" for Dr. Rahul Sharma, confirm.
4. In the patient window the appointment shows Postponed within a few seconds, with a notification and a toast. Accept or choose another time.
5. Staff Messages shows the SMS and WhatsApp that were sent. Overview shows analytics.

## Clinic desk pages
- Overview: live KPIs, 7/14/30 day charts (appointments, wait time, busiest hours, reasons), doctor performance, activity.
- Live queue: per doctor; Call next, Done, Missed; Called away (postpone or move to a colleague); walk-in tokens.
- Doctors: status, called away, block time off.
- Appointments: search and filter, reschedule, cancel, walk-in, CSV export.
- Messages: delivery log and broadcast to today's patients.
- Settings: walk-ins on/off, extra wait, reminder lead time, patient-facing notice, activity log.
- Waiting-room screen (`/staff/display`): big token board, tokens only, no personal details.

## Real SMS and WhatsApp (Twilio)
Add the keys from `.env.example` to `.env.local` and restart. Without them messages are logged and marked "simulated".
Patient replies (1 = accept new time, CANCEL = cancel) are handled by `POST /api/twilio/inbound`; point your Twilio
number's incoming-message webhook at it and set `TWILIO_WEBHOOK_URL` so the signature is verified.
Reminders are sent by the server on its own: no cron is needed while the app is running.

## Structure
- `middleware.ts` route protection by role
- `lib/server/` database, auth, seed data, business logic (`service.ts`), analytics, Twilio sender
- `app/api/` auth, patient actions (`/api/action`), staff actions (`/api/staff/*`), Twilio webhook
- `app/(app)/`, `app/(auth)/`, `app/(open)/` patient pages. `app/staff/` clinic desk
- `lib/data.ts` clinic and doctor catalogue (edit to add your clinic). Hospitals are fictional sample data.

## Before going live
- Set `SESSION_SECRET` to a long random value and serve over HTTPS.
- Staff accounts are seeded. Add a way to create and rotate them (script or admin page) and change the demo passwords.
- SQLite suits a single server. For several servers move to PostgreSQL (queries are in `lib/server/service.ts`).
- The login rate limiter is in memory; use a shared store behind a load balancer.
- Keep consent and privacy rules for patient phone numbers (India DPDP Act). Replace sample hospital numbers with verified ones.
- MediWay is not a medical device. It does not diagnose and does not replace a doctor or emergency services.
