import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/components/landing/inner-page.module.css'
import FAQAccordion from '@/components/landing/FAQAccordion'
import { ScissorsIcon } from '@/components/landing/LandingIcons'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Respondemos las dudas más comunes sobre FiloDesk — precios, funciones, soporte y más.',
}

const FAQS = [
  {
    q: '¿Necesito saber de tecnología para usar FiloDesk?',
    a: 'No. FiloDesk está diseñado para dueños de barberías, no para técnicos. Si podés usar WhatsApp, podés usar FiloDesk. La interfaz es simple y directa al punto.',
  },
  {
    q: '¿Cómo funciona el período de prueba?',
    a: '14 días completamente gratis, sin tarjeta de crédito. Accedés a todas las funciones del plan Base y decidís si seguís sin ningún compromiso.',
  },
  {
    q: '¿Puedo usar FiloDesk desde el celular?',
    a: 'Sí. FiloDesk funciona desde cualquier navegador — celular, tablet o computadora. No necesitás descargar ninguna app. Abrís el navegador, entrás y listo.',
  },
  {
    q: '¿Cuántos barberos puedo tener?',
    a: 'El plan Base soporta hasta 6 barberos. Si tenés más o necesitás múltiples usuarios con diferentes roles, el plan Pro (próximamente) no tiene límite.',
  },
  {
    q: '¿Cómo se calculan las comisiones?',
    a: 'Configurás el porcentaje de cada barbero una sola vez. A partir de ahí, cada venta que registrás le suma comisión automáticamente. Al cerrar el mes tenés el detalle exacto de lo que le corresponde a cada uno.',
  },
  {
    q: '¿Puedo dar acceso a mi encargado o a mis barberos?',
    a: 'Eso llega con el plan Pro. Con roles diferenciados, el encargado puede gestionar el local sin ver las finanzas, y cada barbero accede solo para registrar sus propios servicios.',
  },
  {
    q: '¿Qué medios de pago acepta FiloDesk para la suscripción?',
    a: 'Cobrámos a través de Mercado Pago (tarjeta de crédito, débito, transferencia bancaria). El cobro es mensual y podés cancelar cuando quieras desde tu cuenta.',
  },
  {
    q: '¿Qué incluye el control de stock?',
    a: 'Podés cargar tus productos con stock inicial y cada vez que se vende un producto se descuenta automáticamente. Recibís una alerta cuando el stock baja del mínimo que configuraste.',
  },
  {
    q: '¿Los datos son seguros?',
    a: 'Sí. Toda la información se guarda con cifrado y nunca se comparte con terceros. En caso de que canceles, te enviamos una copia de todos tus datos antes de eliminarlos.',
  },
  {
    q: '¿Tienen soporte en español y en Argentina?',
    a: 'Sí. El soporte es por WhatsApp, en español rioplatense, en horario comercial argentino. No hay chatbots — te responde alguien del equipo.',
  },
]

const CATEGORIES = [
  { label: 'Primeros pasos', ids: [0, 1, 2] },
  { label: 'Funciones',      ids: [3, 4, 5, 7] },
  { label: 'Pagos y datos',  ids: [6, 8, 9] },
]

export default function FAQPage() {
  return (
    <div className={styles.wrapper}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>
            <ScissorsIcon size={18} />
            FiloDesk
          </Link>
          <Link href="/" className={styles.backLink}>
            ← Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className={styles.pageHero}>
        <span className={styles.pageLabel}>Soporte</span>
        <h1 className={styles.pageH1}>
          Preguntas <span className={styles.pageH1Accent}>frecuentes</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Todo lo que necesitás saber antes de arrancar. Si no encontrás tu respuesta,{' '}
          <a href="https://wa.me/5491169461099" target="_blank" rel="noopener noreferrer" style={{ color: '#f2c345', textDecoration: 'none' }}>
            escribinos por WhatsApp
          </a>.
        </p>
      </div>

      {/* FAQ por categorías */}
      <div className={styles.content}>
        {CATEGORIES.map(cat => (
          <div key={cat.label} style={{ marginBottom: '3rem' }}>
            <h2
              className={styles.proseH2}
              style={{ marginBottom: '1.25rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f2c345' }}
            >
              {cat.label}
            </h2>
            <FAQAccordion items={cat.ids.map(i => FAQS[i])} />
          </div>
        ))}

        {/* CTA */}
        <div className={styles.pageCta}>
          <h3>¿Todavía tenés dudas?</h3>
          <p>Escribinos por WhatsApp y te respondemos en el día.</p>
          <a
            href="https://wa.me/5491169461099"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnCta}
          >
            Hablar con el equipo →
          </a>
        </div>
      </div>

      {/* Footer mínimo */}
      <footer className={styles.pageFooter}>
        <p>
          ¿Preguntas? Escribinos a{' '}
          <a href="mailto:hola@filodesk.com">hola@filodesk.com</a>
          {' '}· © 2026 FiloDesk
        </p>
      </footer>
    </div>
  )
}
