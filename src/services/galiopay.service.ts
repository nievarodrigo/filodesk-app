const API_BASE = 'https://api.galiopay.com/v1'

interface CreatePaymentLinkInput {
  referenceId: string
  amount: number
  description: string
  email?: string
  name?: string
}

interface PaymentLinkResponse {
  id: string
  url: string
  status: string
}

export async function createPaymentLink(input: CreatePaymentLinkInput) {
  const { referenceId, amount, description, email, name } = input

  const body = {
    reference_id: referenceId,
    amount: Math.round(amount),
    currency: 'ARS',
    description,
    ...(email && { customer_email: email }),
    ...(name && { customer_name: name }),
    products: [
      {
        name: description,
        quantity: 1,
        unit_price: Math.round(amount),
      },
    ],
  }

  try {
    const res = await fetch(`${API_BASE}/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GALIOPAY_API_KEY}`,
        'X-Client-Id': process.env.GALIOPAY_CLIENT_ID || '',
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
        'X-Client-Id': process.env.GALIOPAY_CLIENT_ID || '',
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
