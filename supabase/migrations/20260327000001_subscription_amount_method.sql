-- Agrega monto y método de pago de la suscripción
alter table barbershops
  add column if not exists subscription_amount         numeric(10,2),
  add column if not exists subscription_payment_method text;
