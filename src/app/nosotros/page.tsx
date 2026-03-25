import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/legal/legal.module.css'

export const metadata: Metadata = {
  title: '¿Quiénes somos?',
  description: 'Conocé el equipo detrás de FiloDesk y por qué construimos esta herramienta.',
}

export default function NosotrosPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.back}>← Volver al inicio</Link>

        <div className={styles.logo}>✦ FiloDesk</div>
        <h1 className={styles.title}>¿Quiénes somos?</h1>
        <p className={styles.updated}>Hecho en Argentina 🇦🇷</p>

        <div className={styles.section}>
          <h2>El origen</h2>
          <p>
            FiloDesk nació de una conversación real con un dueño de barbería que llevaba
            sus cuentas en un cuaderno y una hoja de Excel que nadie entendía.
          </p>
          <p style={{ marginTop: 12 }}>
            Vimos que el problema no era la voluntad — era que no existía una herramienta
            simple, pensada para barberías argentinas, que resolviera lo que más duele:
            saber cuánto generó cada barbero y cuánto te queda a vos al final del día.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Cómo trabajamos</h2>
          <p>
            Somos un equipo pequeño, con foco total en un solo producto. Sin distracciones,
            sin funciones de relleno. Cada nueva característica la decidimos junto a los
            dueños que usan FiloDesk todos los días.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Por qué FiloDesk</h2>
          <ul>
            <li><strong>Pensado para barberías:</strong> no es un sistema genérico adaptado, está construido desde cero para este rubro.</li>
            <li><strong>100% argentino:</strong> precios en pesos, cobro por Mercado Pago y soporte en el mismo huso horario.</li>
            <li><strong>En constante mejora:</strong> escuchamos a quienes usan el producto y mejoramos semana a semana.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>Contacto</h2>
          <p>
            ¿Tenés alguna pregunta o sugerencia? Escribinos a{' '}
            <a href="mailto:hola@filodesk.com" style={{ color: 'var(--gold)' }}>hola@filodesk.com</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
