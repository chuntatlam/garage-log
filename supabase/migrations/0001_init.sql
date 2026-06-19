-- Garage Log: initial schema
-- Run this in the Supabase SQL Editor (or via `supabase db push` if using the CLI).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. bikes — one row per vehicle profile
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.bikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  make text,
  model text,
  year int,
  registration_no text,
  vin text,
  purchase_date date,
  insurance_expiry date,
  puc_expiry date,                      -- pollution/emissions certificate expiry
  current_odometer numeric not null default 0,
  odometer_unit text not null default 'km' check (odometer_unit in ('km', 'mi')),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. fuel_entries — fill-up log; efficiency is derived client-side from
--    consecutive odometer readings, so no separate "efficiency" column.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.fuel_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bike_id uuid not null references public.bikes(id) on delete cascade,
  entry_date date not null,
  odometer numeric not null,
  quantity numeric not null,            -- liters (or kWh for EVs)
  cost numeric,
  fuel_type text,                       -- petrol / diesel / ev-charge / other
  notes text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. maintenance_entries — history of work actually performed
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.maintenance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bike_id uuid not null references public.bikes(id) on delete cascade,
  type text not null,                   -- e.g. 'oil_change', 'battery_change' — see src/lib/maintenanceTypes.ts
  service_date date not null,
  odometer numeric not null,
  cost numeric,
  vendor text,
  notes text,
  receipt_url text,                     -- storage path in the maintenance-receipts bucket
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. maintenance_schedule — one row per (bike, type), drives "next due"
--    calculation. Updated whenever a matching maintenance_entries row is
--    logged (handled in the app, not via trigger, to keep logic visible).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.maintenance_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bike_id uuid not null references public.bikes(id) on delete cascade,
  type text not null,
  interval_km numeric,                  -- nullable: either/both thresholds may be set
  interval_months numeric,
  last_done_date date,
  last_done_odometer numeric,
  created_at timestamptz not null default now(),
  unique (bike_id, type)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────
create index if not exists idx_bikes_user on public.bikes (user_id);
create index if not exists idx_fuel_bike on public.fuel_entries (bike_id, entry_date desc);
create index if not exists idx_maint_entries_bike on public.maintenance_entries (bike_id, service_date desc);
create index if not exists idx_schedule_bike on public.maintenance_schedule (bike_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — every table is scoped to its own user_id column
-- directly (not via a join back to bikes), so each policy is a flat,
-- cheap-to-evaluate check.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.bikes enable row level security;
alter table public.fuel_entries enable row level security;
alter table public.maintenance_entries enable row level security;
alter table public.maintenance_schedule enable row level security;

create policy "bikes_own_rows" on public.bikes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "fuel_entries_own_rows" on public.fuel_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "maintenance_entries_own_rows" on public.maintenance_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "maintenance_schedule_own_rows" on public.maintenance_schedule
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Storage — bucket for service receipt/invoice photos.
-- Files are stored under `${auth.uid()}/${bike_id}/${filename}` so the
-- first path segment can be checked against auth.uid() in the policy.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('maintenance-receipts', 'maintenance-receipts', false)
on conflict (id) do nothing;

create policy "receipts_select_own" on storage.objects
  for select using (
    bucket_id = 'maintenance-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'maintenance-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_delete_own" on storage.objects
  for delete using (
    bucket_id = 'maintenance-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime — broadcast changes so a second open device (e.g. the desktop
-- tab) updates live when an entry is logged on the phone.
-- ─────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.bikes;
alter publication supabase_realtime add table public.fuel_entries;
alter publication supabase_realtime add table public.maintenance_entries;
alter publication supabase_realtime add table public.maintenance_schedule;
