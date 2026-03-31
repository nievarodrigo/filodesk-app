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
