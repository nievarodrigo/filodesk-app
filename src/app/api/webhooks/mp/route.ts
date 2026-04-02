import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServiceClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'
import { verifyMPSignature } from '@/lib/mp-webhook'

export async function POST(req: NextRequest) {
  try {
    // Leer el body como texto para validar la firma
    const rawBody = await req.text().catch(() => '')
    if (!rawBody) {
      console.warn('[MP webhook] empty body')
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // SECURITY: Validar que la firma proviene de MercadoPago
    let bodyId: string | undefined
    try { const p = JSON.parse(rawBody); bodyId = p?.data?.id ?? p?.id } catch {}
    const isValid = await verifyMPSignature(req, bodyId)
    if (!isValid) {
      const error = new Error('Invalid Mercado Pago webhook signature')
      Sentry.captureException(error)
      console.warn('[MP webhook] invalid signature — rejecting')
      // Retornar 200 para no revelar al atacante que la firma falló (recomendación de MP)
      return NextResponse.json({ ok: true })
    }

    // Parsear el body
    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.warn('[MP webhook] failed to parse JSON')
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const { type, data } = body as { type?: string; data?: Record<string, unknown> }

    // SECURITY: Solo procesar eventos de suscripción
    if (type !== 'subscription_preapproval') {
      return NextResponse.json({ ok: true })
    }

    const subscriptionId = data?.id as string
    const queryId = req.nextUrl.searchParams.get('id')

    // SECURITY: Si viene query id, validar que coincida con el body
    if (queryId && subscriptionId !== queryId) {
      console.warn('[MP webhook] ID mismatch:', { subscriptionId, queryId })
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    if (!subscriptionId) {
      console.warn('[MP webhook] missing subscription ID in body')
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const supabase = createServiceClient()
    const result = await subscriptionService.processWebhook(supabase, subscriptionId)

    if (result.error) {
      const error = new Error(`[MP webhook] processing failed: ${result.error}`)
      Sentry.captureException(error)
      console.error('[MP webhook] processing failed:', result.error)
    }

    // Siempre 200 — MP no debe reintentar por errores internos nuestros
    return NextResponse.json({ ok: true })
  } catch (error) {
    Sentry.captureException(error)
    console.error('[MP webhook] unexpected error:', error)
    return NextResponse.json({ ok: true })
  }
}
