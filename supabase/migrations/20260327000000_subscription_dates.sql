-- Agrega fechas de suscripción a barbershops
alter table barbershops
  add column if not exists subscription_starts_at  timestamptz,
  add column if not exists subscription_renews_at  timestamptz;
