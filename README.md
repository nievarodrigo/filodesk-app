# FiloDesk

Sistema de gestión para barberías. Registrá ventas, controlá gastos, seguí comisiones y visualizá el rendimiento del negocio.

## Funcionalidades

- **Inicio** — KPIs del día (servicios, ingresos, barberos activos) y neto del mes con toggle de privacidad
- **Ventas** — Registro de servicios y productos, historial con filtro por fechas, gráfico de ingresos por día/semana
- **Gastos** — Registro por categoría (Alquiler, Sueldos, Productos, Servicios, Otros), gráfico apilado por categoría
- **Productos** — Catálogo con stock, gráfico de productos más vendidos
- **Barberos** — Alta/baja con porcentaje de comisión por barbero
- **Configuración** — Tipos de servicio con precio personalizable
- **Multi-barbero** — Cada venta registra el barbero y calcula la comisión automáticamente

## Stack

- [Next.js 16](https://nextjs.org/) — App Router, Server Components, Server Actions
- [Supabase](https://supabase.com/) — PostgreSQL + Auth + RLS (multi-tenant)
- [Recharts](https://recharts.org/) — Gráficos
- CSS Modules — Dark theme

## Desarrollo local

```bash
npm install
```

Creá un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

```bash
npm run dev
```

La app corre en [http://localhost:3001](http://localhost:3001).

## Deploy

Desplegado en [Vercel](https://vercel.com). Las variables de entorno necesarias:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```
