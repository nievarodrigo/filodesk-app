-- Add plan_name column to barbershops table
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS plan_name text;
