/**
 * Resuelve la URL base del sitio según el ambiente de Vercel.
 *
 * Estrategia:
 * 1. Production (VERCEL_ENV === 'production'): VERCEL_PROJECT_PRODUCTION_URL (custom domain)
 * 2. Preview/Develop: VERCEL_URL (deployment preview *.vercel.app)
 * 3. Local: http://localhost:3001
 *
 * Fuente: https://vercel.com/docs/environment-variables/system-environment-variables
 */
export function getSiteUrl(): string {
  // Production: usar custom domain configurado en Vercel
  if (
    process.env.VERCEL_ENV === 'production' &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  // Preview / Develop: usar URL del deployment de Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Local: fallback a localhost
  return 'http://localhost:3001'
}
