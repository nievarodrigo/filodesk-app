# Contexto para Claude — Pruebas de Pasarelas de Pago FiloDesk

## Repo
- GitHub: `github.com/nievarodrigo/filodesk-app`
- Rama de trabajo: `develop`
- Deploy preview: `https://filodesk-app-git-develop-rodr0s-projects.vercel.app`

---

## Stack
Next.js (App Router), Supabase (PostgreSQL + RLS), Mercado Pago, GalioPay, Vercel.

---

## Lo que ya funciona ✅

### GalioPay (Transferencia bancaria)
- Flujo completo funcionando: se crea el payment link, el cliente transfiere, GalioPay manda webhook, FiloDesk activa el plan.
- Sandbox probado y funcionando con botón "Aprobar pago".
- Webhook en `src/app/api/webhooks/galiopay/route.ts`.
- Docs de integración guardadas en el vault de Obsidian: `FiloApp-Vault/📁 Técnico/GalioPay — Flujo de Pago por Transferencia.md`.

### Turnstile (Cloudflare)
- Reactivado y funcionando en el formulario de registro.
- Dominios autorizados en Cloudflare: `filodesk.app`, `filodesk-app.vercel.app`, `filodesk-app-git-develop-rodr0s-projects.vercel.app`, `localhost`.

### Suscripción — fix trial
- Cuando `subscription_status = 'trial'`, el botón de los planes ya no aparece como "Activo" (bug corregido en `SuscripcionClient.tsx`).

---

## Lo que está pendiente de probar 🔴

### MP Checkout Pro (pago único)
**Archivos clave:**
- `src/services/subscription.service.ts` → función `createMPCheckout`
- `src/app/suscripcion/exito-pago/page.tsx` → página de éxito/verificación
- `src/app/api/webhooks/mp/route.ts` → webhook de MP

**Flujo esperado:**
1. Usuario elige "Pagar X meses" → se crea `checkout_intent` en DB
2. FiloDesk crea preferencia en MP → redirige a `sandbox_init_point` (en test) o `init_point` (en prod)
3. Usuario paga en MP → MP redirige a `/suscripcion/exito-pago?barbershopId=...&payment_id=...&external_reference=...`
4. FiloDesk verifica el pago contra la API de MP (monto, external_reference, moneda)
5. Si OK → activa el plan en la barbería

**Importante:** Usar `sandbox_init_point` (ya implementado — se activa automáticamente cuando `MP_ACCESS_TOKEN` empieza con `TEST-`).

**Bug pendiente:** Al apretar "volver" desde la pantalla de MP, el usuario queda con sesión cerrada. Hay que identificar si:
- Es el browser back (no debería afectar sesión)
- Es el botón "Volver" de MP que redirige a `back_url.failure`
- Necesitamos ver a qué URL redirige cuando aparece "sesión cerrada"

**Cómo testear:**
1. Entrar con credenciales TEST de MP en `.env.local` o Vercel develop
2. Ir a `/suscripcion?barbershopId=TU_BARBERSHOP_ID`
3. Elegir "Pagar este mes"
4. Debería redirigir a `sandbox.mercadopago.com.ar`
5. Completar pago con tarjeta de test de MP
6. Verificar que vuelva a `/suscripcion/exito-pago` y muestre "¡Pago acreditado!"
7. Verificar en Supabase → tabla `barbershops` que `subscription_status = 'active'`

**Tarjetas de test de MP (Argentina):**
- Visa aprobada: `4509 9535 6623 3704` | CVV: `123` | Venc: cualquiera futura | Nombre: `APRO`
- Para rechazar: nombre `OTHE`

---

### MP Débito Automático (preapproval)
**Archivos clave:**
- `src/services/subscription.service.ts` → función `createMPSubscription`
- `src/app/api/webhooks/mp/route.ts` → webhook

**Cambio importante ya hecho:** Se corrigió de `preapproval_plan` (template genérico) a `preapproval` (suscripción directa del usuario). Antes, el `external_reference` era ignorado por MP y el webhook no sabía a qué barbería activar.

**Flujo esperado:**
1. Usuario elige "Débito automático" → FiloDesk crea `preapproval` en MP con `external_reference: barbershopId`
2. MP redirige al usuario para autorizar el débito
3. Cada mes MP cobra y manda webhook a `/api/webhooks/mp`
4. FiloDesk verifica la suscripción y activa/renueva el plan

**Problema conocido en local:** MP no acepta `localhost` en `back_url`. En develop de Vercel debería funcionar porque usa `VERCEL_URL`.

**Bug a investigar:** Al presionar "volver" desde MP, la sesión se pierde. Necesitás identificar a qué URL redirige MP cuando el usuario cancela/vuelve.

---

## Variables de entorno críticas

En Vercel develop deben estar:
```
MP_ACCESS_TOKEN=TEST-xxxx   ← credenciales de prueba
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxxx
GALIOPAY_API_KEY=...
GALIOPAY_CLIENT_ID=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
```

---

## Archivos clave del proyecto

| Archivo | Qué hace |
|---|---|
| `src/app/suscripcion/SuscripcionClient.tsx` | UI del flujo de pago |
| `src/app/suscripcion/page.tsx` | Server component de la página |
| `src/app/suscripcion/exito-pago/page.tsx` | Verificación post-pago de MP Checkout |
| `src/app/actions/subscription.ts` | Server actions de pago |
| `src/services/subscription.service.ts` | Lógica de negocio de suscripciones |
| `src/services/galiopay.service.ts` | API client de GalioPay |
| `src/app/api/webhooks/mp/route.ts` | Webhook de MercadoPago |
| `src/app/api/webhooks/galiopay/route.ts` | Webhook de GalioPay |
| `src/repositories/checkout-intent.repository.ts` | Intenciones de pago (idempotencia) |
| `src/repositories/barbershop.repository.ts` | Activación del plan en la barbería |

---

## Seguridad — cambios recientes

- RLS activado en `admin_users`, `admin_expenses`, `checkout_intents`
- Política RLS en `checkout_intents`: el usuario puede insertar/leer intents solo de sus propias barberías

---

## Notas adicionales

- `getSiteUrl()` en `src/lib/vercel-url.ts` resuelve la URL correcta según el ambiente (prod/preview/local)
- `sandbox_init_point` se usa automáticamente cuando `MP_ACCESS_TOKEN` empieza con `TEST-`
- GalioPay usa `sandbox: true` cuando `NODE_ENV !== 'production'` o `GALIOPAY_SANDBOX=true`
- El `checkout_intent` es necesario para verificar pagos de MP Checkout Pro con seguridad e idempotencia
