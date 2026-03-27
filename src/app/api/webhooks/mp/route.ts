import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  const { type, data } = body

  if (type !== 'subscription_preapproval') {
    return NextResponse.json({ ok: true })
  }

  const subscriptionId = data?.id
  if (!subscriptionId) return NextResponse.json({ ok: false }, { status: 400 })

  const supabase = createServiceClient()
  const result = await subscriptionService.processWebhook(supabase, subscriptionId)

  if (result.error) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true })
}
