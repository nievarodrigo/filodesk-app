# Rate Limiting Plan — FiloDesk

**Status:** PENDING  
**Priority:** MEDIUM  
**File to create:** `src/middleware.ts`

---

## WHY

Sin rate limiting, las rutas `/api/*` y `/auth/*` son vulnerables a:
- Brute force en login/register
- Enumeración de usuarios
- DoS attacks
- Abuso de recursos (webhooks, exports)

---

## IMPLEMENTATION

### Opción 1: Middleware básico en memoria (Quick Win)

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; timestamp: number }>()
const WINDOW_MS = 60 * 1000 // 1 minuto
const MAX_REQUESTS_AUTH = 20 // Login/register
const MAX_REQUESTS_API = 100 // API general

function getRateLimitKey(req: NextRequest): string {
  return req.ip ?? 'unknown'
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const key = getRateLimitKey(request)
  const now = Date.now()
  
  let maxRequests = MAX_REQUESTS_API
  
  if (path.startsWith('/auth/login') || path.startsWith('/auth/register')) {
    maxRequests = MAX_REQUESTS_AUTH
  }
  
  if (path.startsWith('/api/') || path.startsWith('/auth/')) {
    const record = rateLimit.get(key)
    
    if (record) {
      if (now - record.timestamp < WINDOW_MS) {
        if (record.count >= maxRequests) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429, headers: { 'Retry-After': '60' } }
          )
        }
        record.count++
      } else {
        record.count = 1
        record.timestamp = now
      }
    } else {
      rateLimit.set(key, { count: 1, timestamp: now })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/auth/:path*']
}
```

### Opción 2: Vercel Edge Config (Producción)

Para múltiples instancias/regiones, usar Redis o Vercel KV:

```typescript
// src/middleware.ts (con Vercel KV)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { incr } from '@vercel/edge'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  if (!path.startsWith('/api/') && !path.startsWith('/auth/')) {
    return NextResponse.next()
  }

  const ip = request.ip ?? 'unknown'
  const key = `ratelimit:${ip}`
  
  const count = await incr(key, 1, { 
    expiresIn: 60 // 1 minuto en segundos
  })
  
  if (count > 20) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/auth/:path*']
}
```

---

## LIMITS RECOMENDADOS

| Endpoint | Max requests | Window | Notes |
|----------|--------------|--------|-------|
| `/auth/login` | 20 | 1 min | Brute force protection |
| `/auth/register` | 10 | 1 min | Bot registration prevention |
| `/api/*` general | 100 | 1 min | General API protection |
| `/api/webhooks/*` | Sin límite | - | Webhooks no deben ser rate limited |

---

## VALIDATION

```bash
# Test con Apache Bench (reemplazar dominio)
ab -n 25 -c 1 -p data.txt https://filodesk.com/auth/login

# Esperado: 24 requests OK, 25to返回 429
```

---

## MONITORING

Agregar logging para rate limit hits:

```typescript
if (count > maxRequests) {
  console.warn(`[RateLimit] Blocked ${ip} on ${path}`)
  // Opcional: Enviar a Sentry
  Sentry.captureMessage('Rate limit exceeded', {
    extra: { ip, path, count }
  })
}
```

---

## ROLLBACK

```bash
git revert HEAD -- src/middleware.ts
vercel --prod
```
