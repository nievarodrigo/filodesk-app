import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServiceClient } from '@/lib/supabase/server'
import * as checkoutIntentRepo from '@/repositories/checkout-intent.repository'
import * as barbershopRepo from '@/repositories/barbershop.repository'

// REGLA CRÍTICA: responder 200 siempre. Si respondemos otro código, GalioPay reintenta.
const OK = () => NextResponse.json({ received: true }, { status: 200 })

export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    console.warn('[GalioPay webhook] error leyendo body')
    return OK()
  }

  if (!rawBody) {
    console.warn('[GalioPay webhook] body vacío')
    return OK()
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    console.warn('[GalioPay webhook] JSON inválido')
    return OK()
  }

  const paymentId = body.id as string
  const status = body.status as string
  const referenceId = body.referenceId as string // = checkout_intent UUID
  const amount = body.amount as number
  const currency = (body.currency as string) || 'ARS'
  const paymentDate = (body.date as string) || new Date().toISOString()
  const sandbox = body.sandbox as boolean | undefined

  if (!paymentId || !status || !referenceId) {
    console.warn('[GalioPay webhook] payload incompleto', { paymentId, status, referenceId })
    return OK()
  }

  console.log(`[GalioPay webhook] recibido id=${paymentId} status=${status} ref=${referenceId} amount=${amount} ${currency}`)
  if (sandbox) console.warn('[GalioPay webhook] ⚠️ SANDBOX — pago de prueba')

  // Solo procesamos pagos aprobados
  if (status !== 'approved') {
    console.log(`[GalioPay webhook] status=${status}, ignorado`)
    return OK()
  }

  try {
    // SECURITY: usar service role — el webhook no tiene sesión de usuario
    const supabase = createServiceClient()

    // 1. Buscar la intención de pago (referenceId = intentId creado en la action)
    const intent = await checkoutIntentRepo.findById(supabase, referenceId)
    if (!intent) {
      console.error(`[GalioPay webhook] intent no encontrado: ${referenceId}`)
      return OK()
    }

    // 2. Marcar como completado de forma atómica (idempotencia)
    //    Si ya estaba completado, .single() devuelve error → saltamos sin activar doble
    const markResult = await checkoutIntentRepo.markCompletedIfPending(supabase, intent.id, paymentId)
    if (markResult.error) {
      console.warn(`[GalioPay webhook] intent ya procesado: ${referenceId}`)
      return OK()
    }

    // 3. Calcular fecha de vencimiento según meses pagados
    const months: number = intent.months ?? 1
    const paid = new Date(paymentDate)
    const expiresAt = new Date(paid.getFullYear(), paid.getMonth() + months, paid.getDate()).toISOString()

    // 4. Activar suscripción en la barbería
    await barbershopRepo.activateGaliopaySubscription(
      supabase,
      intent.barbershop_id,
      paymentId,
      paymentDate,
      expiresAt,
    )

    console.log(`[GalioPay webhook] ✅ suscripción activada barbershop=${intent.barbershop_id} expires=${expiresAt}`)
  } catch (error) {
    Sentry.captureException(error)
    console.error('[GalioPay webhook] error procesando pago:', error)
    // Igual respondemos 200 para que GalioPay no reintente con datos ya procesados
  }

  return OK()
}

// GET para verificación de conectividad (challenge de GalioPay)
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('challenge')
  if (challenge) return new NextResponse(challenge, { status: 200 })
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
