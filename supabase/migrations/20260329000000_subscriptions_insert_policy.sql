DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subs_insert_own') THEN
        create policy "subs_insert_own" on subscriptions
          for insert
          with check (
            barbershop_id in (
              select id from barbershops where owner_id = auth.uid()
            )
          );
    END IF;
END $$;
