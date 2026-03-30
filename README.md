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

## Stack

- [Next.js](https://nextjs.org/) — App Router, Server Components, Server Actions
- [Supabase](https://supabase.com/) — PostgreSQL + Auth + RLS (multi-tenant)
- [Mercado Pago](https://www.mercadopago.com.ar/developers) — Suscripciones recurrentes (Preapproval API)
- [Recharts](https://recharts.org/) — Gráficos
- [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) — Anti-bot en login/registro
- CSS Modules — Dark/Light theme con variables CSS
- Deploy en [Vercel](https://vercel.com)

## Arquitectura

El proyecto sigue un patrón de capas:

```
src/
├── types/          → Tipos TypeScript compartidos
├── repositories/   → Acceso a base de datos (queries Supabase)
├── services/       → Lógica de negocio (reglas, cálculos, llamadas a APIs externas)
├── app/actions/    → Server Actions (validar → service → revalidate/redirect)
├── app/api/        → API routes (parsear request → service → response)
├── components/     → Componentes UI (React)
├── lib/            → Utils, config, Supabase client, validaciones Zod
└── app/            → Rutas y páginas (Next.js App Router)
```

| Capa | Hace | NO hace |
|------|------|---------|
| **Types** | Define interfaces y tipos compartidos | — |
| **Repository** | Queries a Supabase, recibe `supabase` client como parámetro | No tiene lógica de negocio, no importa Next.js |
| **Service** | Lógica de negocio, llama a repositories y APIs externas | No hace `revalidatePath`, `redirect`, ni parsea `FormData` |
| **Action** | Valida input (Zod), llama al service, maneja `revalidatePath`/`redirect` | No tiene queries SQL ni lógica de negocio |
| **API Route** | Parsea request HTTP, llama al service, devuelve response | No tiene queries SQL ni lógica de negocio |

### Arquitectura de Roles (RBAC)

FiloDesk soporta tres roles por barbería:

- `owner` — acceso total a la barbería, configuración, finanzas, equipo, stock y suscripción.
- `manager` — acceso operativo amplio, pero sin acciones sensibles como cambiar el plan o eliminar la barbería.
- `barber` — acceso acotado al registro de ventas.

La asignación se resuelve con `barbershop_members` y el contexto de seguridad del servidor. El sistema de entitlements por plan define si la funcionalidad multiusuario está habilitada:

- `Base` — no habilita multiusuario.
- `Pro` — habilita `multi_user`.
- `Premium IA` — habilita `multi_user` e `ia_predict`.

Si una barbería está en plan `Base`, un usuario con rol `manager` o `barber` no obtiene contexto válido de acceso.

### Seguridad y Autorización

La protección del dashboard se apoya en dos pilares:

- `getServerAuthContext(...)` — resuelve en servidor el rol real del usuario, el plan activo y los permisos efectivos antes de renderizar layouts o páginas sensibles.
- RLS en Supabase — las tablas críticas usan políticas de Row Level Security para asegurar aislamiento entre barberías y evitar accesos fuera de contexto.

Reglas importantes:

- Las acciones de usuario deben usar `createClient()` para respetar RLS.
- `createServiceClient()` queda reservado para webhooks, callbacks o procesos sin sesión donde el bypass de RLS esté justificado.
- Las rutas sensibles del dashboard validan permisos con `canAccess(role, permission)` antes de cargar datos.

### Supabase clients

Hay dos clientes de Supabase con distintos permisos:

| Cliente | Función | Cuándo usarlo |
|---------|---------|---------------|
| `createClient()` | Cliente con sesión del usuario (respeta RLS) | Páginas y acciones del usuario autenticado |
| `createServiceClient()` | Cliente con service_role key (bypasea RLS) | Webhooks, páginas de callback sin sesión (ej: éxito de pago) |

### Agregar una feature nueva

1. Crear el **type** en `src/types/`
2. Crear el **repository** en `src/repositories/` con las queries necesarias
3. Crear el **service** en `src/services/` con la lógica de negocio
4. Crear la **action** en `src/app/actions/` (thin wrapper)
5. Crear la **página/componente** en `src/app/`

## Desarrollo local

```bash
npm install
npm run dev  # corre en localhost:3001
```

Copiá `.env.local.example` como `.env.local` y completá las variables.

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Settings → API Keys → service_role (bypasea RLS)

# Mercado Pago
MP_ACCESS_TOKEN=                  # Credenciales de producción (cuenta real)
NEXT_PUBLIC_MP_PUBLIC_KEY=

# Solo en staging/desarrollo — fuerza el email del pagador para cuentas de prueba MP
MP_TEST_PAYER_EMAIL=

# Cloudflare Turnstile (anti-bot)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# URL del sitio
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

En Vercel las variables están separadas por ambiente:
- `MP_ACCESS_TOKEN` y `NEXT_PUBLIC_MP_PUBLIC_KEY` tienen un valor para **Production** (cuenta real) y otro para **Preview/Development** (cuenta de prueba)
- `MP_TEST_PAYER_EMAIL` solo existe en **Preview/Development**

## Ramas y ambientes

| Rama | Ambiente | URL | Credenciales MP |
|------|----------|-----|-----------------|
| `main` | Production | filodesk.app | Cuenta real |
| `develop` | Staging (Preview) | filodesk-app-git-develop-*.vercel.app | Cuenta de prueba (tucu) |

**Flujo de trabajo:**
```bash
git checkout develop     # trabajar siempre en develop
# ... commits ...
git push                 # se deploya a staging automáticamente

# cuando está listo para producción:
git checkout main
git merge develop
git push                 # se deploya a filodesk.app
git checkout develop     # volver a develop
```

## Testing con Mercado Pago sandbox

Para probar el flujo de pagos en staging se usan cuentas de prueba de MP:

- **Vendedor (collector):** cuenta tucu — sus credenciales están en Vercel como vars de Preview
- **Comprador (payer):** cuenta Joselewis — entrá a mercadopago.com.ar con esa cuenta para completar el pago en el checkout de prueba

Requisito: el vendedor y el comprador **deben ser ambos cuentas de prueba**. Si mezclás una cuenta real con una de prueba, MP rechaza el pago.

Antes de hacer un pago de prueba, deslogueate de mercadopago.com.ar/developers para que no interfiera con el checkout.

## Testing

El proyecto usa Vitest para pruebas unitarias de lógica de negocio.

```bash
npm test
```

Cobertura actual:

- Suscripciones: descuentos, totales y cálculo de fechas de renovación.
- Planes: matriz de entitlements por plan.
- Permisos: la arquitectura de permisos se consume desde `canAccess(...)` y `getServerAuthContext(...)` en la capa de autorización.

El workflow de CI ejecuta `npm install` y `npm test` en pushes y pull requests hacia `develop` y `main`.

## Monitoreo

El proyecto integra Sentry con Next.js para rastreo de errores en tiempo real.

Se capturan fallos especialmente en:

- webhooks críticos, como Mercado Pago,
- server actions de suscripción,
- acciones administrativas sensibles.

## Base de datos

Ver `supabase/README.md` para instrucciones sobre migraciones.
