import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    /*
     * CSP Policy - SECURITY NOTE:
     * 
     * 'unsafe-inline' NECESARIO para:
     * - Next.js hydration (React requiere inline styles/scripts)
     * - Sentry error tracking (inyecta scripts inline)
     * 
     * 'unsafe-eval' NECESARIO para:
     * - Next.js con Turbopack (eval dinámico en dev/build)
     * 
     * Para producción más estricta (futuro):
     * - Implementar Nonces para scripts: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
     * - Migrar a strict-dynamic donde sea posible
     * 
     * Los dominios externos (Stripe, MercadoPago, Turnstile, Supabase) son necesarios
     * para funcionalidades de pago y autenticación.
     */
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.turnstile.cloud https://sdk.mercadopago.com; frame-src 'self' https://www.mercadopago.com.ar https://sdk.mercadopago.com; connect-src 'self' https://api.mercadopago.com https://www.mercadopago.com.ar https://*.supabase.co https://*.vercel.app; img-src 'self' data: https: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline';"
  }
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
})
