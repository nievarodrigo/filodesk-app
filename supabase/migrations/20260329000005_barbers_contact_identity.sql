alter table barbers
add column if not exists phone text,
add column if not exists email text;

create unique index if not exists barbers_barbershop_email_unique_idx
on barbers (barbershop_id, lower(email))
where email is not null;
