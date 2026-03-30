import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const rateLimit = new Map<string, { count: number; timestamp: number }>()
const WINDOW_MS = 60 * 1000
const MAX_REQUESTS_AUTH = 20
const MAX_REQUESTS_API = 100

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

function checkRateLimit(req: NextRequest): NextResponse | null {
  const path = req.nextUrl.pathname
  const key = getRateLimitKey(req)
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
          console.warn(`[RateLimit] Blocked ${key} on ${path}`)
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

  return null
}

export default async function proxy(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl
  const isDashboard  = pathname.startsWith('/dashboard')
  const isOnboarding = pathname.startsWith('/onboarding')
  const isAuthRoute  = pathname.startsWith('/auth')

  // Sin sesión → login
  if ((isDashboard || isOnboarding) && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Con sesión en /auth → al dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/onboarding', '/auth/:path*', '/api/:path*'],
}
