alter table sales
add column if not exists status text not null default 'approved';

create index if not exists sales_status_idx on sales(status);
