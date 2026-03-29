-- =============================================
-- ORQUESTACIÓN DE PLANES Y SUSCRIPCIONES
-- =============================================

-- 1. Tabla de Planes (Catálogo centralizado)
create table if not exists plans (
  id           text primary key, -- 'base', 'pro', 'expert'
  name         text not null,
  price        numeric(10,2) not null,
  features     jsonb,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- Insertamos los planes actuales
insert into plans (id, name, price, features) values
  ('base', 'Base', 11999, '["Hasta 5 barberos", "Dashboard real-time", "Comisiones auto", "Control stock"]'),
  ('pro', 'Pro', 19999, '["Barberos ilimitados", "Roles: Dueño/Encargado/Barbero", "Reportes Excel/PDF"]'),
  ('expert', 'Premium IA', 29999, '["IA Predicción demanda", "Alertas automáticas", "Asistente personalizado"]')
on conflict (id) do update set price = excluded.price, features = excluded.features;

-- 2. Historial de Suscripciones/Pagos
-- Esta tabla vincula la barbería con un plan y un método de pago.
create table if not exists subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  barbershop_id      uuid not null references barbershops(id) on delete cascade,
  plan_id            text not null references plans(id),
  payment_method     text not null check (payment_method in ('mp_subscription', 'mp_checkout', 'bank_transfer', 'trial')),
  status             text not null default 'pending_validation' check (status in ('pending_validation', 'active', 'expired', 'failed')),
  amount             numeric(10,2) not null,
  external_id        text, -- ID de MP (preapproval_id o payment_id) o Referencia de transferencia
  starts_at          timestamptz,
  ends_at            timestamptz,
  created_at         timestamptz default now(),
  validated_at       timestamptz, -- Cuándo el admin aprobó el pago manual
  validated_by       uuid references admin_users(id)
);

-- 3. Índices para performance
create index if not exists idx_subscriptions_barbershop on subscriptions(barbershop_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

-- 4. Habilitar RLS para seguridad
alter table plans enable row level security;
alter table subscriptions enable row level security;

-- Los planes son legibles por todos los usuarios autenticados
create policy "plans_view_all" on plans for select using (true);

-- Las suscripciones solo las ve el dueño de la barbería o el admin
create policy "subs_view_own" on subscriptions
  for select using (
    barbershop_id in (select id from barbershops where owner_id = auth.uid())
    or auth.uid() in (select id from admin_users)
  );

-- Comentario explicativo
comment on table subscriptions is 'Orquestación de pagos FiloDesk (MP y Transferencia)';
