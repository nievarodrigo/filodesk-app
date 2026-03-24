import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isDashboard   = pathname.startsWith('/dashboard')
  const isOnboarding  = pathname.startsWith('/onboarding')
  const isAuthRoute   = pathname.startsWith('/auth')
  const landingUrl    = process.env.NEXT_PUBLIC_LANDING_URL ?? 'https://filodesk-landing.vercel.app'

  // Sin sesión → login de la landing
  if ((isDashboard || isOnboarding) && !user) {
    return NextResponse.redirect(`${landingUrl}/auth/login`)
  }

  // Con sesión en /auth → al dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/onboarding', '/auth/:path*'],
}
