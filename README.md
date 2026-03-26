# FiloDesk

La app #1 para barberías. Ventas, comisiones, gastos y ganancias — todo en un solo lugar.

## Funcionalidades

- **Inicio** — KPIs del día (servicios, ingresos, barberos activos) y neto del mes con toggle de privacidad
- **Ventas** — Registro de servicios y productos, historial con filtro por fechas, gráfico de ingresos por día/semana
- **Gastos** — Registro por categoría (Alquiler, Sueldos, Productos, Servicios, Otros), gráfico apilado por categoría
- **Productos** — Catálogo con stock, gráfico de productos más vendidos
- **Barberos** — Alta/baja con porcentaje de comisión por barbero
- **Nóminas** — Liquidación automática de sueldos por período
- **Finanzas** — Ingresos, gastos, comisiones y ganancia neta por mes
- **Configuración** — Tipos de servicio con precio personalizable
- **Suscripciones** — Pagos recurrentes via Mercado Pago

## Arquitectura

El proyecto sigue un patrón de capas para escalar fácilmente:

```
src/
├── types/          → Tipos TypeScript compartidos
├── repositories/   → Acceso a base de datos (queries Supabase)
├── services/       → Lógica de negocio (reglas, cálculos)
├── app/actions/    → Server Actions (validar → service → revalidate/redirect)
├── app/api/        → API routes (parsear request → service → response)
├── components/     → Componentes UI (React)
├── lib/            → Utils, config, Supabase client, validaciones Zod
└── app/            → Rutas y páginas (Next.js App Router)
```

### Responsabilidad de cada capa

| Capa | Hace | NO hace |
|------|------|---------|
| **Types** | Define interfaces y tipos compartidos | — |
| **Repository** | Queries a Supabase, recibe `supabase` client como parámetro | No tiene lógica de negocio, no importa Next.js |
| **Service** | Lógica de negocio, llama a repositories | No hace `revalidatePath`, `redirect`, ni parsea `FormData` |
| **Action** | Valida input (Zod), llama al service, maneja `revalidatePath`/`redirect` | No tiene queries SQL ni lógica de negocio |
| **API Route** | Parsea request HTTP, llama al service, devuelve response | No tiene queries SQL ni lógica de negocio |

### Agregar una feature nueva

1. Crear el **type** en `src/types/` y exportarlo desde `src/types/index.ts`
2. Crear el **repository** en `src/repositories/` con las queries necesarias
3. Crear el **service** en `src/services/` con la lógica de negocio
4. Crear la **action** en `src/app/actions/` (thin wrapper)
5. Crear la **página/componente** en `src/app/`

## Stack

- [Next.js](https://nextjs.org/) — App Router, Server Components, Server Actions
- [Supabase](https://supabase.com/) — PostgreSQL + Auth + RLS (multi-tenant)
- [Mercado Pago](https://www.mercadopago.com.ar/developers) — Suscripciones recurrentes
- [Recharts](https://recharts.org/) — Gráficos
- CSS Modules — Dark/Light theme con variables CSS
- Deploy en [Vercel](https://vercel.com)

## Desarrollo local

```bash
npm install
npm run dev  # corre en localhost:3001
```

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3001
MP_ACCESS_TOKEN=
NEXT_PUBLIC_MP_PUBLIC_KEY=
```
