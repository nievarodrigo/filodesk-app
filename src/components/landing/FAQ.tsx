'use client'

import { useState } from 'react'
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

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className={styles.faqSection} id="faq">
      <h2 className={styles.sectionTitle}>Preguntas frecuentes</h2>
      <p className={styles.sectionSubtitle}>
        ¿Algo no quedó claro? Escribinos a{' '}
        <a href="mailto:hola@filodesk.com" className={styles.faqEmail}>hola@filodesk.com</a>
      </p>

      <div className={styles.faqList}>
        {FAQS.map((faq, i) => (
          <div key={i} className={styles.faqItem}>
            <button
              className={styles.faqQuestion}
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span>{faq.q}</span>
              <span className={`${styles.faqIcon} ${open === i ? styles.faqIconOpen : ''}`}>▼</span>
            </button>
            {open === i && (
              <p className={styles.faqAnswer}>{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
