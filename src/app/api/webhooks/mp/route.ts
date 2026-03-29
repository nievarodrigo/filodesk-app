import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'
import { verifyMPSignature } from '@/lib/mp-webhook'

export async function POST(req: NextRequest) {
  // Leer el body como texto para validar la firma
  const rawBody = await req.text().catch(() => '')
  if (!rawBody) {
    console.warn('[MP webhook] empty body')
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // SECURITY: Validar que la firma proviene de MercadoPago
  const isValid = await verifyMPSignature(req)
  if (!isValid) {
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

  // Extraer el ID de la query string (el que fue validado por firma)
  const searchParams = req.nextUrl.searchParams
  const queryId = searchParams.get('id')

  // SECURITY: Validar igualdad estricta entre query id y body data.id
  const subscriptionId = data?.id as string
  if (!subscriptionId || subscriptionId !== queryId) {
    console.warn('[MP webhook] ID mismatch or missing:', { subscriptionId, queryId })
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = createServiceClient()
  const result = await subscriptionService.processWebhook(supabase, subscriptionId)

  if (result.error) {
    console.error('[MP webhook] processing failed:', result.error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
