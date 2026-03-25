import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/legal/legal.module.css'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Respondemos las dudas más comunes sobre FiloDesk.',
}

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

export default function FAQPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.back}>← Volver al inicio</Link>

        <div className={styles.logo}>✦ FiloDesk</div>
        <h1 className={styles.title}>Preguntas frecuentes</h1>
        <p className={styles.updated}>
          ¿No encontrás lo que buscás?{' '}
          <a href="mailto:hola@filodesk.com" style={{ color: 'var(--gold)' }}>Escribinos</a>
        </p>

        {FAQS.map((faq, i) => (
          <div key={i} className={styles.section}>
            <h2>{faq.q}</h2>
            <p>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
