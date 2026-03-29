create type barbershop_role as enum ('owner', 'manager', 'barber');

create table if not exists barbershop_members (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references barbershops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role barbershop_role not null default 'barber',
  created_at timestamptz not null default now(),
  unique(barbershop_id, user_id)
);

alter table barbershop_members enable row level security;

create policy "members_view_own" on barbershop_members
  for select
  using (
    barbershop_id in (
      select id from barbershops where owner_id = auth.uid()
    )
    or user_id = auth.uid()
  );
