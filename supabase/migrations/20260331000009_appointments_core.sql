-- Agenda appointments core

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references barbershops(id) on delete cascade,
  barber_id uuid not null references barbers(id) on delete restrict,
  client_name text not null,
  client_phone text,
  service_id uuid references service_types(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  constraint appointments_time_order check (end_time > start_time)
);

create index if not exists idx_appointments_barbershop_start on appointments(barbershop_id, start_time);
create index if not exists idx_appointments_barber_start on appointments(barber_id, start_time);
create index if not exists idx_appointments_status on appointments(status);

alter table appointments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'appointments' and policyname = 'appointments_owner_all'
  ) then
    create policy "appointments_owner_all" on appointments
      for all using (
        barbershop_id in (select id from barbershops where owner_id = auth.uid())
      )
      with check (
        barbershop_id in (select id from barbershops where owner_id = auth.uid())
      );
  end if;
end $$;

alter table service_types
  add column if not exists duration_min integer not null default 30;

alter table service_types
  drop constraint if exists service_types_duration_min_check;

alter table service_types
  add constraint service_types_duration_min_check check (duration_min > 0);
