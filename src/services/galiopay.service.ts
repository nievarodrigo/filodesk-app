const API_BASE = process.env.GALIOPAY_API_BASE || 'https://pay.galio.app/api'

// FIX #080: CVU y Alias de servidor, nunca expone al cliente
const GALIOPAY_CVU = process.env.GALIOPAY_CVU
const GALIOPAY_ALIAS = process.env.GALIOPAY_ALIAS

interface CreatePaymentLinkInput {
  referenceId: string
  amount: number
  description: string
  email?: string
  name?: string
}

interface PaymentLinkResponse {
  url: string
  proofToken: string
  referenceId: string
  sandbox: boolean
}

interface PaymentResponse {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'refunded' | 'failed'
  date: string
  referenceId: string
  type: string
  moneyReleaseDate?: string
  netAmount?: number
}

interface RefundResponse {
  success: boolean
  message: string
  payment: {
    id: string
    status: 'refunded'
  }
}

export function getGalioPayCredentials() {
  return {
    cvu: GALIOPAY_CVU,
    alias: GALIOPAY_ALIAS,
  }
}

export async function createPaymentLink(input: CreatePaymentLinkInput) {
  const { referenceId, amount, description, email, name } = input
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  const isSandbox = process.env.NODE_ENV !== 'production'

  // Payload según documentación oficial de GalioPay Payment Links API
  const body = {
    referenceId,
    items: [
      {
        title: description,
        quantity: 1,
        unitPrice: Math.round(amount),
        currencyId: 'ARS',
      },
    ],
    backUrl: {
      success: `${siteUrl}/suscripcion/exito-pago`,
      failure: `${siteUrl}/suscripcion?error=galiopay`,
    },
    // Webhook para recibir notificaciones de pago
    notificationUrl: `${siteUrl}/api/webhooks/galiopay`,
    sandbox: isSandbox,
  }

  try {
    const res = await fetch(`${API_BASE}/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GALIOPAY_API_KEY}`,
        'x-client-id': process.env.GALIOPAY_CLIENT_ID || '',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[GalioPay] Error:', data)
      return { error: 'galiopay_error' as const, details: data }
    }

    return { paymentLink: data as PaymentLinkResponse }
  } catch (err) {
    console.error('[GalioPay] Exception:', err)
    return { error: 'network_error' as const }
  }
}

export async function getPaymentLink(linkId: string) {
  try {
    const res = await fetch(`${API_BASE}/payment-links/${linkId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.GALIOPAY_API_KEY}`,
        'x-client-id': process.env.GALIOPAY_CLIENT_ID || '',
      },
    })

    const data = await res.json()

    if (!res.ok) {
      return { error: 'not_found' as const }
    }

    return { paymentLink: data as PaymentLinkResponse }
  } catch (err) {
    console.error('[GalioPay] Exception:', err)
    return { error: 'network_error' as const }
  }
}

// ─────────────────────────────────────────────
// Payments API — Consultar y reembolsar pagos
// ─────────────────────────────────────────────

export async function getPayment(paymentId: string) {
  try {
    const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.GALIOPAY_API_KEY}`,
        'x-client-id': process.env.GALIOPAY_CLIENT_ID || '',
      },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[GalioPay] Get payment error:', data)
      return { error: 'payment_not_found' as const, details: data }
    }

    return { payment: data as PaymentResponse }
  } catch (err) {
    console.error('[GalioPay] Exception:', err)
    return { error: 'network_error' as const }
  }
}

export async function refundPayment(paymentId: string, options?: {
  reason?: string
  refundType?: 'total' | 'partial'
  refundAmount?: number
}) {
  try {
    const body: Record<string, unknown> = {}

    if (options?.reason) body.reason = options.reason
    if (options?.refundType) {
      body.refundType = options.refundType
      if (options.refundType === 'partial' && options.refundAmount) {
        body.refundAmount = options.refundAmount
      }
    }

    const res = await fetch(`${API_BASE}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GALIOPAY_API_KEY}`,
        'x-client-id': process.env.GALIOPAY_CLIENT_ID || '',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[GalioPay] Refund error:', data)
      return { error: 'refund_failed' as const, details: data }
    }

    return { refund: data as RefundResponse }
  } catch (err) {
    console.error('[GalioPay] Exception:', err)
    return { error: 'network_error' as const }
  }
}

// ─────────────────────────────────────────────
// Sandbox Actions — Para testing en sandbox
// ─────────────────────────────────────────────

export async function approveSandboxPayment(paymentLinkId: string, proofToken: string) {
  try {
    const res = await fetch(`${API_BASE}/payment-links/${paymentLinkId}/sandbox-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof: proofToken, action: 'approve' }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[GalioPay] Sandbox approve error:', data)
      return { error: 'sandbox_failed' as const, details: data }
    }

    return { payment: data.payment }
  } catch (err) {
    console.error('[GalioPay] Exception:', err)
    return { error: 'network_error' as const }
  }
}
