'use client'

import { useState } from 'react'
import { generateInviteWhatsAppLink } from '@/lib/whatsapp'
import styles from './equipo.module.css'

interface Props {
  phone: string | null
  email: string
  barbershopName: string
}

export default function InviteMemberActions({ phone, email, barbershopName }: Props) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register`
    : '/auth/register'
  const inviteMessage = `Sumate a mi equipo en FiloDesk: ${inviteUrl}`
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(`Invitación a ${barbershopName} en FiloDesk`)}&body=${encodeURIComponent(`¡Hola! 💈\n\nTe invito a sumarte a mi equipo en ${barbershopName} dentro de FiloDesk para que puedas registrar tus ventas y ver tus comisiones.\n\nRegistrate acá: ${inviteUrl}`)}`

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteMessage)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className={styles.quickActions}>
      {phone && (
        <a
          href={generateInviteWhatsAppLink(phone, barbershopName)}
          target="_blank"
          rel="noreferrer"
          className={styles.quickActionButton}
          aria-label="Invitar por WhatsApp"
          title="Invitar por WhatsApp"
        >
          WhatsApp
        </a>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className={styles.quickActionButton}
        title="Copiar link de acceso"
      >
        {copied ? 'Copiado' : 'Copiar link'}
      </button>
      <a
        href={mailtoHref}
        className={styles.quickActionButton}
        title="Enviar por email"
      >
        Email
      </a>
    </div>
  )
}
