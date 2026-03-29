-- Agrega transaction_id a product_sales para agrupar productos de una misma venta
alter table product_sales
  add column if not exists transaction_id uuid not null default gen_random_uuid();
