import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * NOTE: Rate limiting se delega a Cloudflare WAF.
 * El middleware de Next.js se ejecuta en entorno stateless (Vercel Functions)
 * donde un Map en memoria no persiste entre requests/distribución en nodos.
 * 
 * Para rate limiting efectivo, configurar en Cloudflare:
 * - Dashboard → Security → WAF → Rate Limiting Rules
 * - O usar Cloudflare Workers para lógica custom
 * 
 * Docs: https://developers.cloudflare.com/waf/rate-limiting-rules/
 */

export default async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              // FIX #080: sameSite 'lax' para cross-site cookies (redirecciones de MP/GalioPay)
              sameSite: 'lax',
              httpOnly: options?.httpOnly ?? true,
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
              path: options?.path ?? '/',
              maxAge: options?.maxAge,
            })
          })
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
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/onboarding', '/auth/:path*', '/api/:path*', '/suscripcion/:path*', '/suscripcion'],
}
