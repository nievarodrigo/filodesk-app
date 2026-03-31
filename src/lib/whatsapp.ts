import { getSiteUrl } from '@/lib/vercel-url'

function normalizeWhatsAppPhone(phone: string | null | undefined) {
  if (!phone) return null

  const normalized = phone.replace(/\D/g, '')
  return normalized.length > 0 ? normalized : null
}

function getInviteRegisterUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/register`
  }

  return `${getSiteUrl()}/auth/register`
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

export function generateInviteWhatsAppLink(
  phone: string | null | undefined,
  barbershopName: string
) {
  const target = normalizeWhatsAppPhone(phone)
  const registerUrl = getInviteRegisterUrl()
  const message = [
    '¡Hola! 💈',
    `Te invito a sumarte a mi equipo en ${barbershopName} dentro de FiloDesk para que puedas registrar tus ventas y ver tus comisiones.`,
    `Registrate acá: ${registerUrl}`,
  ].join(' ')

  return target
    ? `https://wa.me/${target}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function generateAppointmentWhatsAppLink(
  phone: string | null | undefined,
  clientName: string,
  dateLabel: string,
  timeLabel: string
) {
  const target = normalizeWhatsAppPhone(phone)
  const message = [
    `Hola ${clientName}, te confirmo tu turno para el ${dateLabel} a las ${timeLabel} en FiloDesk.`,
    '¡Te esperamos!',
  ].join(' ')

  return target
    ? `https://wa.me/${target}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`
}
