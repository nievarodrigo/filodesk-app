# FiloDesk — Contexto de sesión (2026-03-25)

## Qué es FiloDesk
SaaS para administrar barberías. Next.js 16.2.1 App Router + Supabase + Vercel.
Dashboard multi-tenant con RLS. CSS Modules (tema oscuro/claro). Recharts para gráficos.

## Stack técnico clave
- **Auth**: Supabase SSR con cookies. `getSession()` (NO `getUser()`) en Server Components.
- **Proxy**: `src/proxy.ts` con `export default` (NO middleware.ts, NO named export).
- **Server Actions**: formularios de login, logout, ventas, productos, barberos.
- **Temas**: `ThemeProvider` + `ThemeToggle` en sidebar. Variables CSS en `globals.css`.
- **Deploy**: Vercel (filodesk-app). Landing pausado (filodesk-landing).

## Cambios realizados en esta sesión

### 1. Bug de auth resuelto
- Navegar dentro del dashboard redirigía al login.
- **Causa raíz**: `<Link href="/api/auth/signout">` en Sidebar causaba que Next.js haga prefetch del endpoint de signout, destruyendo la sesión.
- **Fix**: reemplazado con `<form action={logout}><button>`.

### 2. Home page (`/dashboard/[barbershopId]`)
- KPIs: Servicios hoy, Ingresos hoy, Barberos activos (3 columnas).
- BarberosCard: tarjeta compacta con botón "Gestionar" que abre modal para activar/desactivar barberos.
- Formularios lado a lado: Nueva venta de servicio + Vender producto.
- Se removió info financiera sensible (neto, ingresos del mes) → movida a /finanzas.

### 3. Widget de venta de productos
- Autocomplete con navegación por teclado (flechas + Enter + Escape).
- Botón "Ver productos" abre modal (no navega a otra página).
- Carrito multi-producto: agregar varios items, ver subtotales, confirmar todo junto.
- Server action `venderProductos` maneja múltiples items, verifica stock.

### 4. Página /finanzas (NUEVA)
- Selector de mes (tabs últimos 6 meses via `?mes=YYYY-MM`).
- 4 KPIs: Ingresos, Gastos, Comisiones, Neto (con % delta vs mes anterior).
- Stats: Ticket promedio, Mejor día de la semana, Proyección del mes (solo mes actual).
- Gráfico de tendencia: Ingresos vs Gastos (6 meses, siempre visible).
- Dos columnas: Ventas por barbero + Gastos por categoría.
- Dos columnas: Top servicios ranking + Productos más vendidos (pie chart).

### 5. Página /productos mejorada
- KPI de valor de inventario.
- Gráfico de barras mensual toggle (últimos 6 meses).
- Pie chart ampliado a 90 días.
- Tabla con columnas alineadas (último col 160px fijo).

### 6. Sistema de temas (ÚLTIMO CAMBIO)
- **Dark mode**: acento rojo barbería (`--gold: #d44054`) en vez del dorado original.
- **Light mode**: colores del poste de barbería — rojo (`--gold: #c41e3a`), blanco (fondo), azul (`--blue: #1e3a6e`).
- Todos los colores hardcodeados (`#1e1e1e`, `#3a3a3a`, `#2a2a2a`, `#7a7060`, `#0e0e0e`) reemplazados por variables CSS (`var(--surface)`, `var(--border)`, `var(--hover)`, `var(--muted)`, `var(--bg)`) en 31 archivos.
- ThemeToggle agregado al sidebar (abajo, antes de "Cerrar sesión").
- Variables nuevas: `--hover`, `--blue`.
- Guardado en localStorage como `filodesk-theme`.

## Archivos clave modificados
```
src/app/globals.css                          — Variables de tema dark/light
src/components/ui/ThemeProvider.tsx           — Context de tema
src/components/ui/ThemeToggle.tsx             — Botón toggle
src/components/dashboard/Sidebar.tsx          — Nav + ThemeToggle
src/app/dashboard/[barbershopId]/page.tsx     — Home dashboard
src/app/dashboard/[barbershopId]/BarberosCard.tsx — Modal barberos
src/app/dashboard/[barbershopId]/VenderProductoWidget.tsx — Carrito productos
src/app/dashboard/[barbershopId]/finanzas/page.tsx — Analytics unificadas
src/app/dashboard/[barbershopId]/finanzas/finanzas.module.css
src/app/dashboard/[barbershopId]/finanzas/ResumenMensual.tsx
src/app/dashboard/[barbershopId]/finanzas/VentasPorBarbero.tsx
src/app/actions/producto.ts                  — Server action venderProductos
src/proxy.ts                                 — Route protection (export default)
scripts/seed-demo.ts                         — Seed de datos demo
```

## Pendientes / futuro
- **Roles de usuario**: solo el dueño accede a /finanzas. Encargados/empleados no ven data financiera.
- **Cloudflare Turnstile**: desactivado en registro, reactivar cuando se configure dominio.
- **Landing page**: pausada (filodesk-landing.vercel.app).
- **Variable `--blue`**: definida pero aún no usada visualmente. Disponible para acentos en light mode.

## Cuenta demo
- Email: `demo@filodesk.com` / Pass: `FiloDesk2024!`
- Seed script: `SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-demo.ts`

## Git
- Repo: github.com/nievarodrigo/filodesk-app
- Último commit: `155bc09` — feat: theme system with dark (red) and light (barbershop pole) modes
- Branch: main
- Todo pusheado y limpio.

## Preferencias del usuario
- No agregar Co-Authored-By de Claude en commits.
- Ir directo a programar, no explorar filesystem en bucles.
- Respuestas concisas. Español argentino.
