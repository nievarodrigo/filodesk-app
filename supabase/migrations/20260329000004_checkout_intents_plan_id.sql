alter table checkout_intents
add column if not exists plan_id text references plans(id);

update checkout_intents
set plan_id = 'base'
where plan_id is null;
