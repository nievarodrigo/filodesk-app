-- Migration: initial schema (already applied manually)
-- This file documents the initial state of the database.
-- Tables were created manually via SQL Editor on 2026-03-24.

-- ── BARBERSHOPS ──────────────────────────────
create table if not exists barbershops (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

-- ── BARBERS ──────────────────────────────────
create table if not exists barbers (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid not null references barbershops(id) on delete cascade,
  name            text not null,
  commission_pct  numeric(5,2) not null default 50,
  active          boolean default true,
  created_at      timestamptz default now()
);

-- ── SERVICE TYPES ─────────────────────────────
create table if not exists service_types (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid references barbershops(id) on delete cascade,
  name            text not null,
  active          boolean default true,
  created_at      timestamptz default now()
);

-- ── SALES ─────────────────────────────────────
create table if not exists sales (
  id               uuid primary key default gen_random_uuid(),
  barbershop_id    uuid not null references barbershops(id) on delete cascade,
  barber_id        uuid not null references barbers(id) on delete restrict,
  service_type_id  uuid not null references service_types(id) on delete restrict,
  amount           numeric(10,2) not null,
  date             date not null default current_date,
  notes            text,
  created_at       timestamptz default now()
);

-- ── PRODUCTS ──────────────────────────────────
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid not null references barbershops(id) on delete cascade,
  name            text not null,
  cost_price      numeric(10,2) not null default 0,
  sale_price      numeric(10,2) not null,
  stock           integer default 0,
  active          boolean default true,
  created_at      timestamptz default now()
);

-- ── PRODUCT SALES ─────────────────────────────
create table if not exists product_sales (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid not null references barbershops(id) on delete cascade,
  product_id      uuid not null references products(id) on delete restrict,
  quantity        integer not null default 1,
  sale_price      numeric(10,2) not null,
  date            date not null default current_date,
  created_at      timestamptz default now()
);

-- ── EXPENSES ──────────────────────────────────
create table if not exists expenses (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid not null references barbershops(id) on delete cascade,
  description     text not null,
  amount          numeric(10,2) not null,
  date            date not null default current_date,
  created_at      timestamptz default now()
);

-- ── PAYROLLS ──────────────────────────────────
create table if not exists payrolls (
  id                uuid primary key default gen_random_uuid(),
  barbershop_id     uuid not null references barbershops(id) on delete cascade,
  barber_id         uuid not null references barbers(id) on delete restrict,
  period_start      date not null,
  period_end        date not null,
  total_sales       numeric(10,2) not null default 0,
  commission_pct    numeric(5,2) not null,
  commission_amount numeric(10,2) not null default 0,
  status            text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at           timestamptz,
  created_at        timestamptz default now()
);
