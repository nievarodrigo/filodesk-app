create policy "subs_insert_own" on subscriptions
  for insert
  with check (
    barbershop_id in (
      select id from barbershops where owner_id = auth.uid()
    )
  );
