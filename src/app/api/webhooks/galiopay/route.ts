import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

/**
 * FIX #080: Webhook endpoint para GalioPay
 * 
 * GalioPay envía notificaciones de pago a esta URL.
 * Payload según docs:
 * - status: "approved" (pago acreditado)
 * - status: "refunded" (reembolso)
 * 
 * Referencia: https://pay.galio.app/api (docs de la API)
 */

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    if (!rawBody) {
      console.warn('[GalioPay webhook] empty body')
      return NextResponse.json({ received: false }, { status: 400 })
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.warn('[GalioPay webhook] failed to parse JSON')
      return NextResponse.json({ received: false }, { status: 400 })
    }

    // Payload de GalioPay (sin wrapper event/data)
    const paymentId = body.id as string
    const status = body.status as string
    const referenceId = body.referenceId as string
    const amount = body.amount as number
    const currency = body.currency as string
    const sandbox = body.sandbox as boolean

    console.log(`[GalioPay webhook] Payment Received: ${paymentId}`)
    console.log(`[GalioPay webhook] Status: ${status}`)
    console.log(`[GalioPay webhook] Reference ID: ${referenceId}`)
    console.log(`[GalioPay webhook] Amount: ${amount} ${currency}`)
    if (sandbox) {
      console.warn('[GalioPay webhook] ⚠️ SANDBOX MODE - Test payment')
    }

    switch (status) {
      case 'approved':
        console.log(`[GalioPay webhook] ✅ Payment approved for ${referenceId}`)
        // TODO: Activar suscripción, enviar email, etc.
        break
      case 'refunded':
        console.log(`[GalioPay webhook] 💸 Payment refunded for ${referenceId}`)
        // TODO: Desactivar suscripción, notificar, etc.
        break
      default:
        console.log(`[GalioPay webhook] Unknown status: ${status}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[GalioPay webhook] unexpected error:', error)
    return NextResponse.json({ received: false }, { status: 500 })
  }
}

// GET para verificación de conectividad
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('challenge')
  if (challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
