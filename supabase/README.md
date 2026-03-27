# Supabase — Base de datos

## Esquema

El esquema completo está en `schema.sql`. Las tablas principales son:

| Tabla | Descripción |
|-------|-------------|
| `barbershops` | Barberías (una por usuario, multi-tenant via RLS) |
| `barbers` | Barberos de cada barbería |
| `service_types` | Tipos de servicio (globales + personalizados por barbería) |
| `sales` | Ventas de servicios |
| `products` | Catálogo de productos |
| `product_sales` | Ventas de productos |
| `expenses` | Gastos del local |
| `payrolls` | Liquidaciones de sueldo |

## Columnas de suscripción en `barbershops`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `subscription_status` | text | `trial` / `active` / `expired` |
| `trial_ends_at` | timestamptz | Fecha de fin del período de prueba |
| `mp_subscription_id` | text | ID de la preapproval en Mercado Pago |
| `subscription_starts_at` | timestamptz | Cuándo se activó la suscripción paga |
| `subscription_renews_at` | timestamptz | Próxima fecha de cobro (de MP) |
| `subscription_amount` | numeric(10,2) | Monto mensual al momento de suscribirse |
| `subscription_payment_method` | text | Método de pago (master, visa, account_money, etc.) |

## Migraciones

Las migraciones están en `migrations/` ordenadas por timestamp. **No se aplican automáticamente** — hay que ejecutarlas manualmente en Supabase → SQL Editor.

### Migraciones aplicadas

| Archivo | Descripción |
|---------|-------------|
| `20260324000000_initial_schema.sql` | Esquema inicial (tablas base) |
| `20260324000001_barbershop_address_phone.sql` | Dirección y teléfono en barbershops |
| `20260324000002_service_default_price.sql` | Precio por defecto en tipos de servicio |
| `20260324000003_expenses_category.sql` | Categoría en gastos |
| `20260327000000_subscription_dates.sql` | `subscription_starts_at` y `subscription_renews_at` |
| `20260327000001_subscription_amount_method.sql` | `subscription_amount` y `subscription_payment_method` |

### Cómo aplicar una migración nueva

1. Crear el archivo en `migrations/` con el formato `YYYYMMDDHHMMSS_descripcion.sql`
2. Ir a **Supabase → SQL Editor**
3. Pegar el contenido del archivo y ejecutarlo
4. Verificar en **Table Editor** que los cambios se aplicaron

## RLS (Row Level Security)

Todas las tablas tienen RLS habilitado. Cada barbería solo puede ver y modificar sus propios datos mediante políticas basadas en `owner_id = auth.uid()`.

Las operaciones sin sesión de usuario (webhooks, callbacks de pago) usan `createServiceClient()` con la `service_role` key que bypasea RLS.
