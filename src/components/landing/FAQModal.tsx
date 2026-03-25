'use client'

import { useState, useEffect } from 'react'
import styles from './landing.module.css'

const FAQS = [
  {
    q: '¿Necesito saber de tecnología para usar FiloDesk?',
    a: 'No. FiloDesk está diseñado para dueños de barberías, no para técnicos. Si podés usar WhatsApp, podés usar FiloDesk.',
  },
  {
    q: '¿Cómo funciona el período de prueba?',
    a: '14 días completamente gratis, sin tarjeta de crédito. Probás todo sin compromiso y decidís si seguís.',
  },
  {
    q: '¿Puedo usar FiloDesk desde el celular?',
    a: 'Sí. FiloDesk funciona desde cualquier navegador, en celular, tablet o computadora. No necesitás descargar nada.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus datos son tuyos. Si cancelás, tenés 30 días para exportarlos. Después se eliminan de forma permanente.',
  },
  {
    q: '¿Puedo tener varios barberos en una misma cuenta?',
    a: 'Sí. Podés cargar todos los barberos de tu local y llevar el seguimiento de cada uno por separado.',
  },
  {
    q: '¿Cómo se cobra la suscripción?',
    a: 'Por Mercado Pago, mensualmente. Podés cancelar cuando quieras desde tu cuenta, sin cargos extra.',
  },
]

export default function FAQModal() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  // Escuchar evento desde MobileNav
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-faq', handler)
    return () => window.removeEventListener('open-faq', handler)
  }, [])

  // Bloquear scroll y cerrar con Escape cuando el modal está abierto
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Trigger desktop */}
      <button className={styles.navFAQBtn} onClick={() => setOpen(true)}>
        FAQ
      </button>

      {/* Modal */}
      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Preguntas frecuentes</h2>
              <button className={styles.modalClose} onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
            </div>

            <div className={styles.faqList}>
              {FAQS.map((faq, i) => (
                <div key={i} className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    aria-expanded={expanded === i}
                  >
                    <span>{faq.q}</span>
                    <span className={`${styles.faqIcon} ${expanded === i ? styles.faqIconOpen : ''}`}>▼</span>
                  </button>
                  {expanded === i && (
                    <p className={styles.faqAnswer}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>

            <p className={styles.modalFooter}>
              ¿Otra pregunta?{' '}
              <a href="mailto:hola@filodesk.com" className={styles.faqEmail}>hola@filodesk.com</a>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
