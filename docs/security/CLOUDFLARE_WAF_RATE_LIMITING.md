# Rate Limiting via Cloudflare WAF

**Status:** MANUAL — Requiere configuración en Cloudflare Dashboard  
**Severity:** HIGH (resuelve QA REPORT #002)  
**Deadline:** Antes de production launch

---

## WHY

El rate limiting en memoria (Map) **no funciona en Vercel** porque:
- Vercel Functions son stateless
- La memoria se resetea entre ejecuciones
- Las requests se distribuyen en múltiples nodos

**Solución:** Delegar rate limiting a Cloudflare WAF — el tráfico malicioso ni llega a Vercel.

---

## CLOUDFLARE WAF CONFIGURATION

### Paso 1: Acceder a Rate Limiting

1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Seleccionar dominio `filodesk.com`
3. Ir a **Security** → **WAF** → **Rate Limiting Rules**

### Paso 2: Crear Reglas

#### Regla 1: Login/Register (crítico)

```
Name: Rate Limit - Auth Routes
Description: Protect against brute force on login/register

Matching:
  - Field: URL Path
  - Operator: contains
  - Value: /auth/login OR /auth/register

Action: Challenge (Captive Portal)
Rate:
  - Requests per minute: 20
  - Period: 60 seconds

Bypass:
  - Cloudflare proxy (ASN Cloudflare): Yes
```

#### Regla 2: API General

```
Name: Rate Limit - API Routes
Description: General API protection

Matching:
  - Field: URL Path
  - Operator: contains
  - Value: /api/

Action: Challenge (Captive Portal)
Rate:
  - Requests per minute: 100
  - Period: 60 seconds
```

### Paso 3: Excepciones

**NO aplicar rate limiting a:**
- `/api/webhooks/mp` — Webhooks de MercadoPago
- `/api/auth/*` — Auth callbacks de Supabase

---

## ALTERNATIVA: Cloudflare Workers (Avanzado)

Si necesitás lógica custom, podés usar Workers:

```javascript
// workers/rate-limit.js
export default {
  async fetch(request, env) {
    const ip = request.headers.get('CF-Connecting-IP')
    const key = `ratelimit:${ip}`
    
    const value = await env.KV.get(key)
    const count = value ? parseInt(value) : 0
    
    if (count >= 20) {
      return new Response('Too Many Requests', { status: 429 })
    }
    
    await env.KV.put(key, String(count + 1), { expirationTtl: 60 })
    return fetch(request)
  }
}
```

**Requiere:**
- Cloudflare Workers (plan Pro o superior para KV)
- Configurar KV namespace en Cloudflare

---

## VALIDATION

```bash
# Test de rate limiting (después de configurar Cloudflare)
# Hacer 20+ requests rápidos a /auth/login
for i in {1..25}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://filodesk.com/auth/login
done

# Esperado:
# 1-20: 200 (normal)
# 21+: 429 (rate limited) o 403 (challenge)
```

---

## MONITORING

En Cloudflare Analytics:
- **Security** → **Events** → Ver requests bloqueados
- **Security** → **Overview** → Rate Limiting hits

---

## ROLLBACK

1. Ir a Cloudflare Dashboard → Security → WAF → Rate Limiting Rules
2. Desactivar o eliminar las reglas creadas

---

## DOCS

- [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Rate Limiting API](https://developers.cloudflare.com/waf/rate-limiting-rules/create-api/)
- [Cloudflare Workers + KV](https://developers.cloudflare.com/workers/runtime-api/kv/)
