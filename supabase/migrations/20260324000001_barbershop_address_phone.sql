-- Migration: add address and phone to barbershops
alter table barbershops add column if not exists address text;
alter table barbershops add column if not exists phone text;
