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
| SEC-002 | Rate limiting middleware | MEDIUM | 🔲 PENDING | `src/middleware.ts` (to create) |
| SEC-003 | Turnstile CAPTCHA re-activation | HIGH | 🔲 PENDING | `src/app/actions/auth.ts` |
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

## PENDING CHANGES

### SEC-002: Rate Limiting Middleware (MEDIUM)

**Archivo a crear:** `src/middleware.ts`

**Propósito:** Limitar requests a `/api/*` y `/auth/*` para prevenir brute force y DoS.

**Código:** Ver `docs/security/RATE_LIMITING_PLAN.md`

---

### SEC-003: Turnstile CAPTCHA (HIGH)

**Archivo:** `src/app/actions/auth.ts:32-35`

**Estado actual:** Comentado con TODO
```typescript
// TODO: reactivar Turnstile cuando se configure el dominio en Cloudflare
```

**Acción requerida:** Descomentar cuando el dominio esté configurado en Cloudflare Turnstile.

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
