-- Usuarios con acceso al panel de administración
create table if not exists admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz default now()
);

-- Gastos operativos del negocio FiloDesk (hosting, dominio, publicidad, etc.)
create table if not exists admin_expenses (
  id          uuid primary key default gen_random_uuid(),
  description text not null,
  amount      numeric(10,2) not null,
  category    text not null check (category in ('hosting', 'dominio', 'publicidad', 'herramientas', 'otros')),
  date        date not null default current_date,
  created_at  timestamptz default now()
);
