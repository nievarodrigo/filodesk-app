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
    q: '¿Puedo tener varios barberos en una misma cuenta?',
    a: 'Sí. El plan Base soporta hasta 6 barberos. Si tenés más, el plan Pro no tiene límite.',
  },
  {
    q: '¿Puedo dar acceso a mi encargado o a mis barberos?',
    a: 'Eso está disponible en el plan Pro. Con roles diferenciados, el encargado puede gestionar el local sin ver las finanzas, y cada barbero accede solo para registrar sus propios servicios.',
  },
  {
    q: '¿Cómo se cobra la suscripción?',
    a: 'Por Mercado Pago, mensualmente. Podés cancelar cuando quieras desde tu cuenta, sin cargos extra.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus datos son tuyos. Al cancelar, te enviamos una copia completa de toda tu información antes de eliminarla de forma permanente.',
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
