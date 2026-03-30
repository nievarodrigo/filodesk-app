export function generatePayrollWhatsAppLink(
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

  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
