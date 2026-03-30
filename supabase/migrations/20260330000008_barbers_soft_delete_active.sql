-- Ensure soft-delete flag exists and is consistent for barbers
alter table if exists public.barbers
  add column if not exists active boolean;

update public.barbers
set active = true
where active is null;

alter table if exists public.barbers
  alter column active set default true;

alter table if exists public.barbers
  alter column active set not null;
