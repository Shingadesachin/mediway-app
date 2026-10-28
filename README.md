# MediWay: Smart Care. Less Waiting.

Two apps in one Next.js 14 project, backed by a real SQLite database and server-side login.

| App | URL | Who | Login |
|---|---|---|---|
| Patient app | `/` | Patients | `/login` |
| Clinic desk (MediWay for Clinics) | `/staff` | Reception and clinic staff | `/staff/login` |
| Doctor portal | `/doctor` | Doctors | `/doctor/login` |
| MediWay admin | `/admin` | MediWay team | `/admin/login` |

Roles are routed to their own portal. Page access is enforced in `middleware.ts` and private APIs use
`requirePatient`, `requireStaff`, `requireDoctor`, or `requireAdmin` in `lib/server/auth.ts`.

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
| Doctor, Dr. Rahul Sharma | rahul.sharma@mediway.app | doctor1234 |
| Doctor, Dr. Pooja Menon | pooja.menon@mediway.app | doctor1234 |
| MediWay admin | admin@mediway.app | admin1234 |

Each staff account is bound to one clinic and can only see and change that clinic's data.
Demo credentials are for local testing only; change them before deployment.

## Try the main flow
1. Open `/staff/login` in one browser window, sign in as `desk@mediway.app`.
2. Open `/login` in a private window, sign in as `demo@mediway.app`, and book Dr. Rahul Sharma for today.
3. In the staff window go to Live queue, press "Called away" for Dr. Rahul Sharma, confirm.
4. In the patient window the appointment shows Postponed within a few seconds, with a notification and a toast. Accept or choose another time.
5. Staff Messages shows the SMS and WhatsApp that were sent. Overview shows analytics.

## Clinic desk pages
- Overview: live KPIs, 7/14/30 day charts (appointments, wait time, busiest hours, reasons), doctor performance, activity.
- Live queue: per doctor; Call next, Done, Missed; Called away (postpone or move to a colleague); walk-in tokens.
- Doctors: status, called away, block time off, add/edit doctors and provision doctor portal logins.
- Appointments: search and filter, reschedule, cancel, walk-in, CSV export.
- Messages: delivery log and broadcast to today's patients.
- Settings: walk-ins on/off, extra wait, reminder lead time, patient-facing notice, activity log.
- Waiting-room screen (`/staff/display`): big token board, tokens only, no personal details.

## Real SMS and WhatsApp (Twilio)
Add the keys from `.env.example` to `.env.local` and restart. Without them messages are logged and marked "simulated".
Patient replies (1 = accept new time, CANCEL = cancel) are handled by `POST /api/twilio/inbound`; point your Twilio
number's incoming-message webhook at it and set `TWILIO_WEBHOOK_URL` so the signature is verified.
Reminders are processed by the server scheduler while the Node.js app is running. For deployments that sleep or
scale to zero, configure an external scheduler to POST `/api/cron/tick` with `Authorization: Bearer $CRON_SECRET`.

## Passwords, sessions and phone numbers

Patient and staff sessions slide for up to 24 hours after activity. The login forms' optional “Keep me signed in”
choice extends the absolute session cap from 7 to 30 days. Doctor and admin logins use the same session policy.
Password reset links expire after 30 minutes and can be used once. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `MAIL_FROM`, and `APP_URL` to deliver reset email. If SMTP is not configured, the server logs a
simulated reset link. Never expose that link outside development.

Phone numbers are validated for the selected country and stored in E.164 format. The default country is India (+91).
An SQLite migration normalizes existing user and appointment phone numbers.

## Location, maps and notifications

Location is requested only after the user chooses the location control; users can instead enter a Mumbai area or
any valid 6-digit Indian PIN code. PIN codes are resolved to a nearby point using OpenStreetMap's Nominatim service,
then clinics are sorted by real distance and filtered by the chosen radius. Browser coordinates are kept client-side.
Clinic and hospital sample coordinates are illustrative.
Maps use Leaflet and OpenStreetMap tiles without an API key; directions open Google Maps.

To enable push notifications, generate VAPID keys with:

```bash
npx web-push generate-vapid-keys
```

Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`, restart the server, then enable push from the
patient profile, clinic desk, or doctor portal. Production push and geolocation require HTTPS. The service worker
handles push clicks and opens the corresponding app page.

## Database and migrations

SQLite upgrades are applied with ordered `PRAGMA user_version` migrations. In addition to the original patient,
appointment, and clinic-operation tables, the app uses `password_resets`, `clinics`, `doctors`,
`clinic_applications`, `push_subscriptions`, and `staff_notifications`. Clinic and doctor catalogue changes are
seeded into SQLite; existing databases are upgraded without dropping existing records.

## Structure
- `middleware.ts` route protection by role
- `lib/server/` database, auth, seed data, business logic (`service.ts`), analytics, Twilio sender
- `app/api/` auth, patient (`/api/action`), staff (`/api/staff/*`), doctor (`/api/doctor/*`), admin, push, cron and Twilio routes
- `app/(app)/`, `app/(auth)/`, `app/(open)/` patient pages; `app/staff/`, `app/doctor/`, `app/admin/` portals
- `lib/data.ts` seed catalogue; clinics and doctors are persisted in SQLite. Hospitals are fictional sample data.

### Auth API

- `POST /api/auth/login` — `identifier`, `password`, optional `portal`, optional `keepSignedIn`
- `POST /api/auth/signup` — patient registration
- `POST /api/auth/forgot` — generic response for password-reset requests
- `POST /api/auth/reset` — single-use password reset with `token` and `password`
- `POST /api/auth/change-password` — authenticated change requiring `currentPassword`
- `GET /api/state` and `GET /api/staff/state` refresh a valid session cookie after one hour of activity.
- `GET /api/location/resolve?pincode=<6-digit PIN>` — resolves an Indian PIN code for distance-based clinic search.
- `POST /api/clinic/applications` — submit a clinic application
- `GET, POST /api/admin/applications` — admin review and approval/rejection
- `POST /api/staff/doctors` — clinic-scoped doctor add/edit and portal setup
- `GET /api/doctor/state`, `POST /api/doctor/action` — doctor queue and authorized queue actions
- `POST /api/push/subscribe`, `POST /api/push/unsubscribe`, `GET /api/push/key` — push subscription management
- `POST /api/staff/notifications` — clinic-scoped read state for staff notifications
- `POST /api/cron/tick` — scheduled reminder processing; requires `CRON_SECRET`

## Deploy to Vercel (demo)
1. Push this folder to a new GitHub repository (do not commit `.env.local` or `data/`; `.gitignore` already excludes them).
2. On vercel.com choose Add New, then Project, and import the repository. Framework: Next.js (detected automatically).
3. Before pressing Deploy, open Environment Variables and add `SESSION_SECRET` with a long random value (40+ characters).
   Configure SMTP and VAPID values for email and push. A persistent Node process is required for the in-process scheduler;
   otherwise invoke `/api/cron/tick` on a schedule using `CRON_SECRET`.
4. Deploy. When it finishes, open `https://YOUR-APP.vercel.app/api/health`. You should see `"ok":true`. If not, the page shows the exact error.
5. Log in with the demo accounts above.

Important: Vercel has no permanent disk. The app keeps its SQLite file in the temporary folder, so demo accounts and sample
data come back on every start, but new signups, bookings and clinic actions can disappear after a few minutes or when Vercel
switches to another server. This is fine for showing screens, not for a live walkthrough that books and then switches roles.
For data that stays, deploy on Railway, Fly.io or a VPS with a persistent volume (set `DATA_DIR` to the volume path), or move
`lib/server` to a hosted Postgres database.

## Before going live
- Set `SESSION_SECRET` to a long random value and serve over HTTPS.
- Change all demo credentials. Clinic applications must be reviewed by the seeded MediWay admin.
- SQLite suits a single server. For several servers move to PostgreSQL (queries are in `lib/server/service.ts`).
- The login rate limiter is in memory; use a shared store behind a load balancer.
- Keep consent and privacy rules for patient phone numbers (India DPDP Act). Replace sample hospital numbers with verified ones.
- MediWay is not a medical device. It does not diagnose and does not replace a doctor or emergency services.
