import { timingSafeEqual, createHmac } from 'crypto'
import { NextRequest } from 'next/server'

/**
 * Valida la firma del webhook de MercadoPago según documentación oficial.
 * Referencias:
 * - https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
 * - https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/payment-notifications
 *
 * MP envía el webhook con:
 * - Query param: `id` (data.id desde URL)
 * - Header `x-request-id`: ID único de la solicitud
 * - Header `x-signature`: formato "ts=<timestamp>,v1=<hmac_sha256>"
 * - Body: JSON con {type, data, ...}
 *
 * Template firmado (EXACTO según doc oficial de MP):
 * "id:{data.id_from_url};request-id:{x-request-id};ts:{ts};"
 *
 * IMPORTANTE: data.id viene de los QUERY PARAMS, NO del body JSON.
 * En algunos casos puede venir en mayúsculas; se normaliza a lowercase.
 *
 * Firma: HMAC-SHA256(template, MP_WEBHOOK_SECRET)
 * Comparación: timing-safe para evitar timing attacks
 * Anti-replay: rechaza timestamps > 5 minutos
 */
export async function verifyMPSignature(req: NextRequest): Promise<boolean> {
  const signature = req.headers.get('x-signature')
  const requestId = req.headers.get('x-request-id')

  if (!signature || !requestId) {
    console.warn('[MP webhook] missing x-signature or x-request-id')
    return false
  }

  // Parsear firma: "ts=1234567890,v1=abcd..."
  const parts = signature.split(',')
  const tsMatch = parts.find(p => p.startsWith('ts='))
  const v1Match = parts.find(p => p.startsWith('v1='))

  if (!tsMatch || !v1Match) {
    console.warn('[MP webhook] malformed x-signature')
    return false
  }

  const ts = tsMatch.replace('ts=', '')
  const providedSignature = v1Match.replace('v1=', '')

  // Validar que el timestamp no sea viejo (anti-replay)
  // Aceptamos timestamps de hasta 5 minutos atrás
  const tsNumber = parseInt(ts, 10)
  const nowSeconds = Math.floor(Date.now() / 1000)
  const ageSeconds = nowSeconds - tsNumber

  if (ageSeconds < 0) {
    console.warn('[MP webhook] timestamp from future (clock skew?)')
    return false
  }

  if (ageSeconds > 300) { // 5 minutos
    console.warn('[MP webhook] timestamp too old:', ageSeconds, 'seconds')
    return false
  }

  // CRITICAL: Leer data.id desde QUERY PARAMS (no desde body)
  // Según doc oficial de MP, el id viene en la URL como parámetro
  const dataId = req.nextUrl.searchParams.get('id')
  if (!dataId) {
    console.warn('[MP webhook] missing id in query params')
    return false
  }

  // Normalizar a lowercase como recomienda la doc (algunos IDs llegan en mayúsculas)
  const normalizedDataId = dataId.toLowerCase()

  // Construir el template firmado EXACTAMENTE como lo especifica MP
  const signedTemplate = `id:${normalizedDataId};request-id:${requestId};ts:${ts};`

  // Obtener la secret key
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    console.error('[MP webhook] MP_WEBHOOK_SECRET not configured')
    return false
  }

  // Calcular HMAC-SHA256
  const expectedSignature = createHmac('sha256', secret)
    .update(signedTemplate)
    .digest('hex')

  // Comparar con timing-safe para evitar timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    )
  } catch {
    console.warn('[MP webhook] signature mismatch')
    return false
  }
}
