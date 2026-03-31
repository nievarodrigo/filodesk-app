import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

/**
 * FIX #080: Webhook endpoint para GalioPay
 * 
 * GalioPay envía notificaciones de pago a esta URL.
 * Referencia: https://docs.galiopay.com/webhooks
 * 
 * Para configurar el webhook en GalioPay:
 * 1. Dashboard GalioPay → Configuración → Webhooks
 * 2. Agregar URL: https://filodesk.com/api/webhooks/galiopay
 * 3. Guardar el webhook secret si GalioPay lo provee
 */

export async function POST(req: NextRequest) {
  try {
    // Leer el body como texto para logging
    const rawBody = await req.text()
    if (!rawBody) {
      console.warn('[GalioPay webhook] empty body')
      return NextResponse.json({ received: false }, { status: 400 })
    }

    // Parsear el body
    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.warn('[GalioPay webhook] failed to parse JSON')
      return NextResponse.json({ received: false }, { status: 400 })
    }

    // FIX #080: Validar origen del webhook usando webhook secret si está configurado
    const webhookSecret = process.env.GALIOPAY_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = req.headers.get('x-galiopay-signature')
      // TODO: Implementar validación de firma HMAC si GalioPay la provee
      // const isValid = validateSignature(rawBody, signature, webhookSecret)
      if (!signature) {
        console.warn('[GalioPay webhook] missing signature header')
        return NextResponse.json({ received: false }, { status: 401 })
      }
    }

    // Extraer datos relevantes del evento
    const eventType = body.event as string || 'unknown'
    const paymentId = (body.data as Record<string, unknown>)?.id as string || body.id as string || 'unknown'
    const status = (body.data as Record<string, unknown>)?.status as string || body.status as string || 'unknown'
    const referenceId = (body.data as Record<string, unknown>)?.reference_id as string || body.reference_id as string || 'unknown'

    // Log prolijo del evento recibido
    console.log(`[Webhook] Payment Received from GalioPay: ${paymentId}`)
    console.log(`[Webhook] Event Type: ${eventType}`)
    console.log(`[Webhook] Status: ${status}`)
    console.log(`[Webhook] Reference ID: ${referenceId}`)

    // Procesar según tipo de evento
    // TODO: Implementar lógica de procesamiento según negocio
    switch (eventType) {
      case 'payment.completed':
      case 'payment.completed':
        console.log(`[Webhook] Payment completed for ${referenceId}`)
        // Aquí: actualizar estado de suscripción, enviar email, etc.
        break
      case 'payment.pending':
        console.log(`[Webhook] Payment pending for ${referenceId}`)
        break
      case 'payment.failed':
        console.log(`[Webhook] Payment failed for ${referenceId}`)
        break
      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`)
    }

    // FIX #080: Idempotency - verificar si ya procesamos este evento
    // TODO: Implementar tabla de eventos procesados para evitar duplicados
    // const alreadyProcessed = await checkEventProcessed(paymentId, eventType)
    // if (alreadyProcessed) {
    //   console.log(`[Webhook] Event already processed, skipping: ${paymentId}`)
    //   return NextResponse.json({ received: true, skipped: true })
    // }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[GalioPay webhook] unexpected error:', error)
    return NextResponse.json({ received: false }, { status: 500 })
  }
}

// GET para verificación de webhook (si GalioPay lo requiere)
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('challenge')
  if (challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
