# QA Technical Review — Security Hardening

**Fecha:** 2026-03-30  
**Proyecto:** FiloDesk (filodesk-app)  
**Branch:** develop  
**Cambios a revisar:** Security headers pre-production  

---

## RESUMEN EJECUTIVO

Se implementaron headers de seguridad HTTP en `next.config.ts` para endurecer la aplicación antes del deploy a producción. Los cambios son defensivos y no alteran funcionalidad existente.

---

## CAMBIOS PROPUESTOS

### Archivo: `next.config.ts`

**Headers de seguridad agregados:**

| Header | Valor | Propósito |
|--------|-------|-----------|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | Force HTTPS obligatorio |
| X-Frame-Options | `DENY` | Previene clickjacking |
| X-Content-Type-Options | `nosniff` | Previene MIME sniffing |
| Referrer-Policy | `strict-origin-when-cross-origin` | Control de referrer |
| X-XSS-Protection | `1; mode=block` | Legacy XSS filter |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | Bloquea APIs sensibles |
| Content-Security-Policy | Ver más abajo | Control de recursos cargados |

**CSP detallado:**
```
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.turnstile.cloud https://sdk.mercadopago.com; 
frame-src 'self' https://www.mercadopago.com.ar https://sdk.mercadopago.com; 
connect-src 'self' https://api.mercadopago.com https://www.mercadopago.com.ar https://*.supabase.co https://*.vercel.app; 
img-src 'self' data: https: blob:; 
font-src 'self' data:; 
style-src 'self' 'unsafe-inline';
```

---

## CHECKLIST DE VALIDACIÓN

### Funcionalidad
- [ ] Login con email/password funciona
- [ ] Login con Google OAuth funciona
- [ ] Registro de nuevos usuarios funciona
- [ ] Dashboard carga correctamente
- [ ] Creación de barbershop funciona
- [ ] Gestión de barberos funciona
- [ ] Registro de ventas funciona
- [ ] Checkout de MercadoPago se completa
- [ ] Webhooks de MP se procesan
- [ ] No hay errores en consola del browser

### Security Headers
- [ ] `curl -I` muestra todos los headers esperados
- [ ] No hay bloqueos de CSP en consola (scripts/recursos legítimos)
- [ ] MercadoPago iframe carga correctamente
- [ ] Supabase connection funciona
- [ ] Stripe (si aplica) funciona

### Edge Cases
- [ ] Usuarios existentes pueden hacer login (no se rompe sesión)
- [ ] URLs con query params funcionan
- [ ] URLs con fragments (#) funcionan
- [ ] API routes funcionan (/api/*)
- [ ] Static assets cargan (/public/*)

---

## FLUJOS CRÍTICOS A TESTEAR

### 1. Autenticación
```
Register → Verify email → Login → Logout → Login again
```

### 2. OAuth
```
Login → Google OAuth → Callback → Dashboard
```

### 3. Suscripción/Pagos
```
Dashboard → Plan selection → MercadoPago checkout → Webhook → Subscription active
```

### 4. Dashboard Operations
```
Login → Create barbershop → Add barbers → Record sale → View reports
```

---

## RIESGOS POTENCIALES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| CSP bloquea script legítimo | BAJA | MEDIA | Testing exhaustivo |
| HSTS rompe acceso HTTP | BAJA | ALTA | Redirect 301 de HTTP a HTTPS |
| X-Frame-Options rompe iframe MP | BAJA | ALTA | `frame-src` configurado |

---

## RECURSOS EXTERNOS EN CSP

| Dominio | Uso | Validado |
|---------|-----|----------|
| js.stripe.com | Stripe (futuro) | ✅ |
| www.turnstile.cloud | Cloudflare CAPTCHA | ✅ |
| www.mercadopago.com.ar | Checkout | ✅ |
| sdk.mercadopago.com | SDK MP | ✅ |
| api.mercadopago.com | API MP | ✅ |
| *.supabase.co | Database | ✅ |
| *.vercel.app | Vercel deployments | ✅ |

---

## EVIDENCIA REQUERIDA

Después del deploy, ejecutar:

```bash
# Verificar headers
curl -I https://filodesk.com

# Esperado output (headers relevantes):
# strict-transport-security: max-age=63072000; includeSubDomains; preload
# x-frame-options: DENY
# x-content-type-options: nosniff
# referrer-policy: strict-origin-when-cross-origin
# content-security-policy: default-src 'self'; ...

# Verificar CSP no bloquea recursos
curl -I https://filodesk.com/api/auth/session
```

---

## COMANDOS PARA TESTING

```bash
# Clone si necesario
cd ~/filodesk-app

# Verificar que el build pasa
npm run build

# Verificar lint
npm run lint

# Si hay tests
npm test
```

---

## NOTAS PARA EL REVIEWER

1. **No hay cambios en lógica de negocio** — solo headers HTTP
2. **No hay cambios en database schema**
3. **No hay cambios en API contracts**
4. **No hay cambios en environment variables**
5. **CSP usa `'unsafe-inline'` y `'unsafe-eval'`** — requerido para Next.js + Sentry
6. **El wildcard `*.supabase.co`** permite todas las regiones de Supabase

---

## APPROVAL CRITERIA

Para aprobar, Gemini debe confirmar:

1. ✅ Build pasa sin errores
2. ✅ Lint pasa sin warnings críticos
3. ✅ Flujos críticos testeados y funcionando
4. ✅ Headers visibles en response
5. ✅ No hay regresiones funcionales

---

**Reviewer:** Gemini CLI  
**Fecha de review:** ___/___/2026  
**Status:** 🟡 PENDING REVIEW
