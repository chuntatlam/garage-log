# Garage Log — Bike Maintenance Tracker

A mobile-first PWA for tracking bike service history, fuel efficiency, and maintenance reminders, synced across phone and computer via Supabase.

## Stack

React + Vite + TypeScript · Tailwind CSS v4 · TanStack Query · React Hook Form + Zod · Recharts · Supabase (Postgres, Auth, Storage, Realtime) · vite-plugin-pwa

No custom backend server — the client talks to Supabase directly, with Postgres Row Level Security enforcing per-user access.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
Z6IQyB0P5rhPegcY
2. Open the SQL Editor and run the contents of `supabase/migrations/0001_init.sql`. This creates the `bikes`, `fuel_entries`, `maintenance_entries`, and `maintenance_schedule` tables, enables Row Level Security on each, creates the private `maintenance-receipts` storage bucket, and adds all four tables to the Realtime publication.
3. (Optional) To enable "Continue with Google": Authentication → Providers → Google, and add your OAuth client ID/secret. Without this step the Google button will show an error, but email/password sign-in works regardless.
4. Go to Project Settings → API and copy the Project URL and anon public key.

## 2. Run it locally

```bash
npm install
cp .env.example .env   # paste in your Supabase URL and anon key
npm run dev
```

## 3. Deploy

Build with `npm run build`, output goes to `dist/`. Either Cloudflare Pages or Vercel work well — both give free HTTPS, which the service worker requires.

- **Cloudflare Pages**: connect the repo, build command `npm run build`, output directory `dist`, and add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as environment variables in the Pages project settings.
- **Vercel**: same build command/output directory, same two environment variables, set via the Vercel dashboard or `vercel env add`.

After deploying, add your deployed URL to Supabase under Authentication → URL Configuration (Site URL and Redirect URLs), or the Google OAuth redirect will fail.

## 4. Install on your phone

- **Android (Chrome)**: open the deployed URL, tap the menu, "Install app" (or you'll get an automatic install banner).
- **iOS (Safari)**: open the deployed URL, tap Share → "Add to Home Screen". Note iOS requires this manual step — there's no install prompt — and push notifications additionally require iOS 16.4+ and that you've already added it to the home screen once.

## How sync works

Every device reads and writes the same Postgres database, so cross-device sync is the default — there's no separate sync layer to maintain. TanStack Query adds caching and refetch-on-reconnect on top, and a Supabase Realtime subscription on each table invalidates the relevant cache when another device writes, so an open tab on your computer updates within a second or two of logging something on your phone.

**Known gap:** there's no offline write queue. If you're somewhere without signal and log a service, the write will fail rather than queue silently. This is a deliberate scope cut for v1 rather than an oversight — worth revisiting (an IndexedDB outbox that replays on reconnect) if it turns out to be a recurring annoyance in practice, but not worth the complexity speculatively.

## Maintenance reminders

`maintenance_schedule` stores an optional distance interval, an optional time interval, or both per (bike, type) — whichever comes due first drives the status shown on the Dashboard and Schedule tabs. Logging a service on the Service tab automatically updates that type's `last_done_date`/`last_done_odometer`; you can also set or adjust intervals directly on the Schedule tab before ever logging an entry.

True push notifications aren't implemented yet — iOS's requirements (16.4+, home-screen install, manual permission grant) make them a meaningfully bigger lift than the in-app due/overdue list this version ships with. If daily push reminders turn out to matter, the natural next step is a Supabase Edge Function on a `pg_cron` schedule that checks `maintenance_schedule` and sends Web Push to subscribed devices.

## Design notes

The visual identity ("garage ledger") pairs a paper-and-ink palette with a copper accent and a dark, mono-digit "instrument plate" used for odometer-style numbers (current mileage, days/km to next service) — a nod to a mechanical trip odometer rather than a generic stat card. Tokens live in `src/index.css` under the `@theme` block if you want to adjust the palette or type scale.

## Project structure

```
src/
  components/        shared UI (Button, Field inputs, StatusPill, OdometerPlate, layout shell)
  hooks/              TanStack Query hooks per table + auth/selected-bike context
  lib/                supabase client, maintenance type list, due-date calculation
  pages/              Dashboard, Fuel, Service (maintenance), Schedule, Bikes, Auth
  types/database.ts  TypeScript types mirroring the Postgres schema
supabase/migrations/0001_init.sql   full schema + RLS + storage policies
```

## Possible next steps

- Offline write queue (see "Known gap" above)
- Web Push reminders via Supabase Edge Functions + `pg_cron`
- CSV/PDF export of service history
