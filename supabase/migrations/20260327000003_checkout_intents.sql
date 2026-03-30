-- Tabla para persistir intenciones de checkout con idempotencia garantizada
-- Flujo: createMPCheckout() → crea intent → MP → exito-pago → verifyCheckoutPayment() → activa
create table if not exists checkout_intents (
  id                 uuid primary key default gen_random_uuid(),
  barbershop_id      uuid not null references barbershops(id) on delete cascade,
  payment_id         text unique, -- MP nos devuelve este ID; único para evitar reuso
  months             integer not null check (months > 0),
  expected_amount    integer not null, -- En pesos ARS enteros (ej: 11999 = $11.999)
  currency_id        text not null default 'ARS',
  status             text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at         timestamptz default now(),
  completed_at       timestamptz,

  -- Índices para búsquedas frecuentes
  constraint checkout_barbershop_payment_idx unique (barbershop_id, payment_id)
);

create index if not exists checkout_intents_barbershop_idx on checkout_intents(barbershop_id);
create index if not exists checkout_intents_status_idx on checkout_intents(status);
create index if not exists checkout_intents_created_idx on checkout_intents(created_at);
