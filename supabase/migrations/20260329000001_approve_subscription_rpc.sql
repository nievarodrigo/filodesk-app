create or replace function approve_subscription_v1(
  p_subscription_id uuid,
  p_admin_id uuid
)
returns void as $$
declare
  v_sub record;
  v_now timestamptz := now();
  v_plan_name text;
begin
  -- 1. Obtener y bloquear la suscripción para evitar race conditions
  select * into v_sub from subscriptions
  where id = p_subscription_id and status = 'pending_validation'
  for update;

  if not found then
    raise exception 'Suscripción no encontrada o ya procesada.';
  end if;

  -- 2. Mapear plan_id a nombre legible (lógica de negocio en DB)
  v_plan_name := case
    when v_sub.plan_id = 'base' then 'Base'
    when v_sub.plan_id = 'pro' then 'Pro'
    else 'Premium IA'
  end;

  -- 3. Actualizar tabla de suscripciones
  update subscriptions set
    status = 'active',
    starts_at = v_now,
    validated_at = v_now,
    validated_by = p_admin_id
  where id = p_subscription_id;

  -- 4. Actualizar tabla de barberías
  update barbershops set
    subscription_status = 'active',
    subscription_starts_at = v_now,
    subscription_renews_at = v_sub.ends_at,
    subscription_amount = v_sub.amount,
    subscription_payment_method = v_sub.payment_method,
    plan_name = v_plan_name
  where id = v_sub.barbershop_id;
end;
$$ language plpgsql;
