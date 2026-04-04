import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/components/landing/inner-page.module.css'
import { ScissorsIcon } from '@/components/landing/LandingIcons'

export const metadata: Metadata = {
  title: '¿Quiénes somos?',
  description: 'Conocé el equipo detrás de FiloDesk y por qué construimos esta herramienta para barberías argentinas.',
}

const VALUES = [
  {
    title: 'Pensado para barberías',
    desc: 'No es un sistema genérico adaptado. Está construido desde cero para este rubro, con el lenguaje y los flujos de trabajo reales de una barbería argentina.',
  },
  {
    title: 'Del rubro, para el rubro',
    desc: 'No construimos FiloDesk desde afuera mirando. Laburamos junto a los dueños, entendemos el oficio y tomamos decisiones basadas en lo que pasa adentro de un local real.',
  },
  {
    title: 'En constante mejora',
    desc: 'Cada nueva función la decidimos junto a los dueños que usan FiloDesk todos los días. Sin funciones de relleno.',
  },
  {
    title: 'Sin complicaciones',
    desc: 'Si podés usar WhatsApp, podés usar FiloDesk. Funciona desde el navegador del celular, sin descargas ni configuraciones técnicas.',
  },
  {
    title: 'Transparencia total',
    desc: 'Ves cuánto generó cada barbero, cuánto te costó el mes y cuánto te queda a vos — en tiempo real, sin fórmulas.',
  },
  {
    title: 'Soporte humano',
    desc: 'No hay chatbots. Cuando escribís por WhatsApp, te responde alguien del equipo que conoce el producto.',
  },
]

export default function NosotrosPage() {
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
        <span className={styles.pageLabel}>Nuestro equipo</span>
        <h1 className={styles.pageH1}>
          Construimos FiloDesk porque<br />
          <span className={styles.pageH1Accent}>el problema era real.</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Nació de una conversación con un dueño de barbería que llevaba sus cuentas en un cuaderno y una hoja de Excel que nadie entendía.
        </p>
      </div>

      {/* Content */}
      <div className={styles.content}>

        {/* Origen */}
        <div className={styles.prose} style={{ marginBottom: '3.5rem' }}>
          <div>
            <h2 className={styles.proseH2}>El origen</h2>
            <p>
              Vimos que el problema no era la voluntad — era que no existía una herramienta simple, pensada para barberías argentinas, que resolviera lo que más duele: saber cuánto generó cada barbero y cuánto te queda a vos al final del día.
            </p>
          </div>
          <div>
            <h2 className={styles.proseH2}>Cómo trabajamos</h2>
            <p>
              Somos un equipo pequeño, con foco total en un solo producto. Sin distracciones, sin funciones de relleno. Hablamos con los dueños, escuchamos los problemas reales y construimos soluciones que se usan desde el primer día.
            </p>
          </div>
        </div>

        {/* Valores */}
        <div className={styles.valuesGrid}>
          {VALUES.map(v => (
            <div key={v.title} className={styles.valueCard}>
              <div className={styles.valueCardAccent} />
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.pageCta}>
          <h3>¿Querés conocer el producto?</h3>
          <p>14 días gratis, sin tarjeta de crédito. Probás todo sin compromiso.</p>
          <Link href="/auth/register" className={styles.btnCta}>
            Empezar gratis →
          </Link>
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
