-- =============================================
-- FiloDesk — Esquema de base de datos
-- =============================================

-- ── BARBERSHOPS ──────────────────────────────
create table barbershops (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

-- ── BARBERS ──────────────────────────────────
create table barbers (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid not null references barbershops(id) on delete cascade,
  name            text not null,
  commission_pct  numeric(5,2) not null default 50, -- porcentaje (ej: 50.00)
  active          boolean default true,
  created_at      timestamptz default now()
);

-- ── SERVICE TYPES ─────────────────────────────
-- barbershop_id = NULL → default global (visible para todos)
-- barbershop_id = X    → servicio custom de esa barbería
create table service_types (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid references barbershops(id) on delete cascade,
  name            text not null,
  active          boolean default true,
  created_at      timestamptz default now()
);

-- Defaults globales
insert into service_types (id, barbershop_id, name) values
  (gen_random_uuid(), null, 'Corte'),
  (gen_random_uuid(), null, 'Barba'),
  (gen_random_uuid(), null, 'Cejas'),
  (gen_random_uuid(), null, 'Corte + Barba'),
  (gen_random_uuid(), null, 'Corte + Barba + Cejas');

-- ── SALES (servicios vendidos) ────────────────
create table sales (
  id               uuid primary key default gen_random_uuid(),
  barbershop_id    uuid not null references barbershops(id) on delete cascade,
  barber_id        uuid not null references barbers(id) on delete restrict,
  service_type_id  uuid not null references service_types(id) on delete restrict,
  amount           numeric(10,2) not null,
  date             date not null default current_date,
  notes            text,
  created_at       timestamptz default now()
);

-- ── PRODUCTS (catálogo del local) ─────────────
create table products (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid not null references barbershops(id) on delete cascade,
  name            text not null,
  cost_price      numeric(10,2) not null default 0,  -- lo que costó
  sale_price      numeric(10,2) not null,             -- lo que se vende
  stock           integer default 0,
  active          boolean default true,
  created_at      timestamptz default now()
);

-- ── PRODUCT SALES (ventas de productos) ───────
create table product_sales (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid not null references barbershops(id) on delete cascade,
  product_id      uuid not null references products(id) on delete restrict,
  quantity        integer not null default 1,
  sale_price      numeric(10,2) not null, -- precio al momento de la venta
  date            date not null default current_date,
  created_at      timestamptz default now()
);

-- ── EXPENSES (gastos del local) ───────────────
create table expenses (
  id              uuid primary key default gen_random_uuid(),
  barbershop_id   uuid not null references barbershops(id) on delete cascade,
  description     text not null,
  amount          numeric(10,2) not null,
  date            date not null default current_date,
  created_at      timestamptz default now()
);

-- ── PAYROLLS (liquidaciones de sueldo) ────────
create table payrolls (
  id                uuid primary key default gen_random_uuid(),
  barbershop_id     uuid not null references barbershops(id) on delete cascade,
  barber_id         uuid not null references barbers(id) on delete restrict,
  period_start      date not null,
  period_end        date not null,
  total_sales       numeric(10,2) not null default 0,
  commission_pct    numeric(5,2) not null,  -- guardamos el % al momento de liquidar
  commission_amount numeric(10,2) not null default 0,
  status            text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at           timestamptz,
  created_at        timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY (multi-tenant)
-- =============================================

alter table barbershops   enable row level security;
alter table barbers        enable row level security;
alter table service_types  enable row level security;
alter table sales          enable row level security;
alter table products       enable row level security;
alter table product_sales  enable row level security;
alter table expenses       enable row level security;
alter table payrolls       enable row level security;

-- barbershops: solo el dueño ve/modifica la suya
create policy "owner_all" on barbershops
  for all using (owner_id = auth.uid());

-- barbers: solo el dueño de la barbería
create policy "owner_all" on barbers
  for all using (
    barbershop_id in (select id from barbershops where owner_id = auth.uid())
  );

-- service_types: ve los globales (null) + los de su barbería
create policy "view_own_and_global" on service_types
  for select using (
    barbershop_id is null
    or barbershop_id in (select id from barbershops where owner_id = auth.uid())
  );
create policy "manage_own" on service_types
  for all using (
    barbershop_id in (select id from barbershops where owner_id = auth.uid())
  );

-- sales
create policy "owner_all" on sales
  for all using (
    barbershop_id in (select id from barbershops where owner_id = auth.uid())
  );

-- products
create policy "owner_all" on products
  for all using (
    barbershop_id in (select id from barbershops where owner_id = auth.uid())
  );

-- product_sales
create policy "owner_all" on product_sales
  for all using (
    barbershop_id in (select id from barbershops where owner_id = auth.uid())
  );

-- expenses
create policy "owner_all" on expenses
  for all using (
    barbershop_id in (select id from barbershops where owner_id = auth.uid())
  );

-- payrolls
create policy "owner_all" on payrolls
  for all using (
    barbershop_id in (select id from barbershops where owner_id = auth.uid())
  );
