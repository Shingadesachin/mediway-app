# Implementation plan

## Files and phases

1. **Auth and sessions:** `components/PasswordInput.tsx`, shared phone input, auth/profile pages and routes, `lib/server/auth.ts`, `lib/server/db.ts`, `lib/server/mailer.ts`, phone utilities, `.env.example`, README.
2. **Location and maps:** `components/MapPanel.tsx`, location controls, `lib/data.ts`, discovery/recommendation/emergency pages, and distance utilities.
3. **Clinics, doctors, and admin:** database-backed catalog and migrations; `lib/server/seed.ts`, `service.ts`, `analytics.ts`, auth/middleware; staff signup, administration, doctor management, and APIs.
4. **Notifications:** PWA assets, push subscription APIs, notification delivery and scheduler, staff notifications and dashboard updates.
5. **Doctor portal:** doctor login/state/action pages and APIs, queue authorization and staff live refresh.

Run `npm run typecheck` and `npm run build` after each phase. Update setup, API, schema, and demo-account documentation in README.

## Tables

Add migration-managed `password_resets`, `clinics`, `doctors`, `clinic_applications`, `push_subscriptions`, and `staff_notifications`; extend `users` for doctor/admin identity and clinic/doctor relationships. Existing tables remain in place and are upgraded with ordered `PRAGMA user_version` migrations and safe `ALTER TABLE` steps.

## New environment variables

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `APP_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `CRON_SECRET`.
