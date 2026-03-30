# Security Audit Log — FiloDesk

**Project:** filodesk-app  
**Audit Date:** 2026-03-30  
**Auditor:** Web Security & Infra Owner  

---

## CHANGELOG DE SEGURIDAD

### 2026-03-30 — Pre-Production Hardening

| # | Change | Severity | Status | Evidence |
|---|--------|----------|--------|----------|
| SEC-001 | Security headers (HSTS, CSP, X-Frame-Options, etc.) | HIGH | ✅ APPLIED | `next.config.ts` |
| SEC-002 | Rate limiting middleware | MEDIUM | ✅ APPLIED | `src/proxy.ts` |
| SEC-003 | Turnstile CAPTCHA re-activation | HIGH | ✅ APPLIED | `src/app/actions/auth.ts`, `RegisterForm.tsx` |
| SEC-004 | Password policy hardening (Supabase) | HIGH | 🔲 PENDING | Dashboard Supabase |
| SEC-005 | 2FA enforcement (GitHub, Supabase, Vercel) | HIGH | 🔲 PENDING | Manual |
| SEC-006 | DMARC record (Cloudflare) | MEDIUM | 🔲 PENDING | DNS |
| SEC-007 | DNS hygiene audit | LOW | 🔲 PENDING | Cloudflare |
| SEC-008 | Supabase project separation (prod/staging) | MEDIUM | 🔲 PENDING | Supabase |

---

## CAMBIOS APLICADOS

### SEC-001: Security Headers ✅

**Fecha:** 2026-03-30  
**Archivo:** `next.config.ts`  
**Commit:** (pendiente de push)

**Headers implementados:**

| Header | Valor | Propósito |
|--------|-------|-----------|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | Force HTTPS por 2 años |
| X-Frame-Options | `DENY` | Previene clickjacking |
| X-Content-Type-Options | `nosniff` | Previene MIME sniffing |
| Referrer-Policy | `strict-origin-when-cross-origin` | Control de referrer |
| X-XSS-Protection | `1; mode=block` | Legacy XSS protection |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | Bloquea APIs sensibles |
| Content-Security-Policy | (ver abajo) | Control de recursos cargados |

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

**Validación post-deploy:**
```bash
curl -I https://filodesk.com | grep -E '(Strict-Transport|X-Frame|Content-Security)'
```

---

### SEC-002: Rate Limiting ✅

**Fecha:** 2026-03-30  
**Archivos:** `src/middleware.ts`, `docs/security/CLOUDFLARE_WAF_RATE_LIMITING.md`  
**Commit:** `6c94207` (original), `f7e1975` (fix QA)

**Nota importante:** El rate limiting se DELEGA a Cloudflare WAF.
- El middleware solo maneja auth/session (proxy functionality)
- Rate limiting en memoria no funciona en Vercel (stateless)
- Configurar en: Cloudflare → Security → WAF → Rate Limiting Rules

**Guía de configuración:** `docs/security/CLOUDFLARE_WAF_RATE_LIMITING.md`

**Validación post-configuración Cloudflare:**
```bash
# Test de rate limiting
for i in {1..25}; do curl -s -o /dev/null -w "%{http_code}\n" https://filodesk.com/auth/login; done
# Esperado: 1-20: 200, 21+: 429/403
```

---

## PENDING CHANGES

### SEC-003: Turnstile CAPTCHA ✅

**Fecha:** 2026-03-30  
**Archivos:** `src/app/actions/auth.ts`, `src/app/auth/register/RegisterForm.tsx`  
**Commit:** `72a4c6c`

**Implementación:**
- Widget de Turnstile en formulario de registro
- Verificación server-side con `verifyTurnstile()`
- Requiere `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en env vars
- Fallback graceful si no está configurado (permite registro)

**Validación post-deploy:**
```bash
# Verificar que el script de Turnstile carga
curl -I https://filodesk.com/auth/register | grep challenges.cloudflare

# Registrar usuario sin CAPTCHA → debería fallar
# Registrar usuario con CAPTCHA válido → debería funcionar
```

---

### SEC-004: Password Policy (HIGH)

**Ubicación:** Supabase Dashboard → Authentication → User Settings → Security

**Cambios:**
| Setting | Current | Recommended |
|---------|---------|-------------|
| Min length | 6 | 12 |
| Require lowercase | ❌ | ✅ |
| Require uppercase | ❌ | ✅ |
| Require numbers | ❌ | ✅ |
| Require special | ❌ | ✅ |

---

### SEC-005: 2FA Enforcement (HIGH)

**Ubicación:** Supabase Dashboard → Authentication → User Settings → Security

**Cambios:**
| Setting | Current | Recommended |
|---------|---------|-------------|
| Min length | 6 | 12 |
| Require lowercase | ❌ | ✅ |
| Require uppercase | ❌ | ✅ |
| Require numbers | ❌ | ✅ |
| Require special | ❌ | ✅ |

---

### SEC-005: 2FA Enforcement (HIGH)

**Checklist manual:**
- [ ] GitHub: Settings → Password and authentication → 2FA obligatorio
- [ ] Supabase: Account → Two-factor authentication
- [ ] Vercel: Team settings → Security → 2FA

---

### SEC-006: DMARC Record (MEDIUM)

**Agregar en Cloudflare DNS:**

```
Type: TXT
Name: _dmarc.filodesk.com
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@filodesk.com; pct=100
```

---

## ROLLBACK PLAN

| Change | Rollback Method |
|--------|-----------------|
| SEC-001 (headers) | `git revert <commit>` + redeploy |
| SEC-002 (middleware) | Eliminar `src/middleware.ts` + redeploy |
| SEC-003 (turnstile) | Recomentar código |
| SEC-004 (password) | Dashboard Supabase |
| SEC-005 (2FA) | Dashboard respectibo |
| SEC-006 (DMARC) | Eliminar TXT record en Cloudflare |

---

## VALIDATION CHECKLIST

Pre-production launch:

- [ ] `curl -I https://filodesk.com` muestra todos los headers
- [ ] Login funciona sin errores
- [ ] Checkout de MercadoPago funciona
- [ ] Webhooks de MP se procesan correctamente
- [ ] Dashboard carga sin problemas
- [ ] No errores de CSP en consola

---

## INCIDENT CONTACTS

| Role | Contact | Responsibility |
|------|---------|----------------|
| DevOps/Security | Rodrigo Nieva | Auditor y implementador |
| Backend Lead | (pendiente) | Revisión de webhooks |
| Frontend Lead | (pendiente) | Validación de CSP |

---

*Documento generado: 2026-03-30*  
*Última actualización: 2026-03-30*
