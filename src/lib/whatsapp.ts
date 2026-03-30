function normalizeWhatsAppPhone(phone: string | null | undefined) {
  if (!phone) return null

  const normalized = phone.replace(/\D/g, '')
  return normalized.length > 0 ? normalized : null
}

export function generatePayrollWhatsAppLink(
  phone: string | null | undefined,
  barberName: string,
  period: string,
  total: string,
  commission: string,
  servicesAmount: string
) {
  const message = [
    `¡Hola ${barberName}! 💈 Este es tu resumen de FiloDesk:`,
    `📅 Período: ${period}`,
    `✂️ Servicios realizados: ${servicesAmount}`,
    `💰 Tu comisión acumulada: ${commission}`,
    `✅ Total neto a cobrar: ${total}`,
    '¡Buen trabajo! 🚀',
  ].join('\n')

  const target = normalizeWhatsAppPhone(phone)

  return target
    ? `https://wa.me/${target}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`
}
