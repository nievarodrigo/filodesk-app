-- Agrega columnas de suscripción GalioPay a barbershops
-- Columnas nuevas — no rompen queries existentes de Mercado Pago:
--   subscription_provider    distingue el proveedor ('mercadopago' | 'galiopay')
--   subscription_payment_id  ID del pago en el proveedor (GalioPay payment id)
--   subscription_paid_at     cuándo se acreditó el pago
-- Las columnas existentes (mp_subscription_id, subscription_renews_at, etc.) no se tocan.

alter table barbershops
  add column if not exists subscription_provider   text,        -- 'mercadopago' | 'galiopay'
  add column if not exists subscription_payment_id text,        -- id del pago en GalioPay
  add column if not exists subscription_paid_at    timestamptz; -- fecha de acreditación
