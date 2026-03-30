alter table barbers
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists barbers_user_id_idx on barbers(user_id);
