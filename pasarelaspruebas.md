# Contexto para Claude — Pasarelas de Pago FiloDesk

**Última actualización:** 2026-04-02

## Repo
- GitHub: `github.com/nievarodrigo/filodesk-app`
- Rama de trabajo: `develop`
- Deploy preview estable: `https://filodesk-app-git-develop-rodr0s-projects.vercel.app`
- Producción: `https://filodesk.app`

---

## Stack
Next.js 16.2.1 (App Router, Turbopack), Supabase (PostgreSQL + RLS), MercadoPago, GalioPay, Vercel.

---

## Estado de pasarelas ✅

### GalioPay (Transferencia bancaria) ✅ FUNCIONANDO
- Flujo completo funcionando en sandbox y producción.
- Webhook en `src/app/api/webhooks/galiopay/route.ts`.

### MP Checkout Pro (pago único) ✅ FUNCIONANDO
- Flujo completo probado en sandbox.
- Usa `sandbox_init_point` automáticamente cuando `VERCEL_ENV !== 'production'`.
- Verificación post-pago en `src/app/suscripcion/exito-pago/page.tsx`.
- Idempotencia con `checkout_intent` en BD.

### MP Débito Automático (preapproval) ✅ FUNCIONANDO (verificado a nivel API y webhook)
- Preapproval se crea y redirige correctamente a MP.
- Webhook recibe, verifica firma y procesa eventos `subscription_preapproval`.
- Simulador de MP devuelve 200 OK correctamente.
- MP sandbox no envía webhooks reales para preapproval (limitación conocida). Verificado end-to-end usando el simulador de MP con un preapproval ID real — la barbería se activó en Supabase correctamente.
- Siempre retorna 200 al webhook para evitar reintentos de MP.

### Turnstile (Cloudflare) ✅ FUNCIONANDO
- Activo en registro.

---

## Variables de entorno críticas en Vercel

### Preview (develop)
```
MP_ACCESS_TOKEN=APP_USR-xxxx        ← de la cuenta TEST VENDEDOR fake (NO la real)
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxx  ← idem
MP_TEST_PAYER_EMAIL=test_user_5348633481902837545@testuser.com  ← cuenta test compradora
MP_WEBHOOK_SECRET=xxxx              ← de MP Developers → Webhooks → Modo de prueba → Clave secreta
GALIOPAY_API_KEY=...
GALIOPAY_CLIENT_ID=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Production
```
MP_ACCESS_TOKEN=APP_USR-xxxx        ← credenciales reales
MP_WEBHOOK_SECRET=xxxx              ← de MP → Webhooks → Modo productivo → Clave secreta
```

---

## Gotchas críticos del sandbox de MP

1. **Desloguearse de TODO MP para que el sandbox funcione** — si hay cualquier sesión activa (real o test) el botón "Pagar" queda deshabilitado sin mensaje de error.
2. **Para preapproval, el `payer_email` debe ser la cuenta test compradora** (`test_user_XXXXX@testuser.com`). En sandbox se usa automáticamente vía `MP_TEST_PAYER_EMAIL`.
3. **El `MP_ACCESS_TOKEN` para preapproval en sandbox debe ser el de la cuenta test VENDEDORA** (APP_USR-, NO el TEST- de tu cuenta real). Usar las credenciales TEST- de la cuenta real causa error "Both payer and collector must be real or test users".
4. **MP sandbox no manda webhooks reales para preapproval**. Usar el simulador en MP Developers → Webhooks → "Simular notificación" → "Planes y suscripciones".
5. **El timestamp del webhook de MP puede venir en ms o segundos** — el código lo maneja automáticamente.
6. **Clock skew**: MP y Vercel tienen hasta ~60s de diferencia de reloj — tolerado en la verificación de firma.

---

## Webhook de MP — URL configurada

| Ambiente | URL |
|---|---|
| Modo de prueba | `https://filodesk-app-git-develop-rodr0s-projects.vercel.app/api/webhooks/mp` |
| Modo productivo | `https://filodesk.app/api/webhooks/mp` |

Evento habilitado: **Planes y suscripciones**

---

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `src/app/suscripcion/SuscripcionClient.tsx` | UI del flujo de pago |
| `src/app/suscripcion/page.tsx` | Server component de la página |
| `src/app/suscripcion/exito-pago/page.tsx` | Verificación post-pago MP Checkout Pro |
| `src/app/suscripcion/exito/page.tsx` | Pantalla de éxito post-preapproval |
| `src/app/actions/subscription.ts` | Server actions de pago |
| `src/services/subscription.service.ts` | Lógica de negocio de suscripciones |
| `src/services/galiopay.service.ts` | API client de GalioPay |
| `src/app/api/webhooks/mp/route.ts` | Webhook de MercadoPago |
| `src/app/api/webhooks/galiopay/route.ts` | Webhook de GalioPay |
| `src/repositories/checkout-intent.repository.ts` | Intenciones de pago (idempotencia) |
| `src/repositories/barbershop.repository.ts` | Activación del plan en la barbería |
| `src/lib/mp-webhook.ts` | Verificación de firma HMAC-SHA256 de MP |
| `src/proxy.ts` | Middleware de Next.js — refresca sesión Supabase en cada request |
| `src/lib/vercel-url.ts` | Resuelve URL base según ambiente |

---

## Bugs corregidos en esta sesión

1. **Sesión perdida al volver de MP** → `src/proxy.ts` tenía bug en `setAll` (creaba nuevo response después de setear cookies, perdiéndolas). Corregido. Además se agregaron rutas `/suscripcion/*` al matcher del proxy.
2. **`proxy.ts` usaba `getSession()` en lugar de `getUser()`** → `getSession()` no valida contra el servidor. Cambiado a `getUser()`.
3. **`createMPSubscription` no usaba `sandbox_init_point`** → Corregido para usar `VERCEL_ENV` para detectar sandbox.
4. **Timestamp del webhook en ms vs segundos** → Detectado y convertido automáticamente.
5. **`payer_email` en preapproval** → En sandbox usa `MP_TEST_PAYER_EMAIL`. En producción necesita el email del usuario en MP (pendiente: agregar campo en UI).
6. **Nombre del plan hardcodeado como "Pro" en pantalla de éxito** → Ahora viene dinámico vía query param `planName`.
7. **`planName` contaminado con params de MP** → Limpiado con `.split('?')[0]`.

---

## Pendiente

- [ ] **Verificar activación end-to-end en producción** con pago real de débito automático
- [ ] **Campo de email MP en UI** para preapproval en producción (el usuario debe ingresar su email de MP)
- [ ] **Bug sesión en checkout pro al presionar "Volver"** → Redirige a `/suscripcion` que ya tiene el proxy, debería estar resuelto. Confirmar.
- [ ] **Rol barbero** — pantalla para que el barbero anote servicios desde el celu. No implementar hasta que el resto esté pulido.
- [ ] **Warning de Supabase** sobre `getSession()` en algún Server Component → buscar con grep y reemplazar por `getUser()`.

---

## Credenciales de prueba

- **Cuenta demo FiloDesk:** `demo@filodesk.com` / `FiloDesk2024!`
- **Tarjeta de test MP (Checkout Pro):** `4509 9535 6623 3704` | CVV: `123` | Venc: cualquiera futura | Nombre: `APRO`
- **Cuenta compradora MP test:** `test_user_5348633481902837545@testuser.com` (contraseña en MP Developers → Cuentas de prueba)
- **barbershopId testing Pro:** `bba517b8-ea61-45d0-8b70-adb41298d54f`
