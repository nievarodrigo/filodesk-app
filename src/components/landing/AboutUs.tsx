import styles from './landing.module.css'

export default function AboutUs() {
  return (
    <section className={styles.section} id="nosotros">
      <p className={styles.sectionLabel}>¿Quiénes somos?</p>
      <h2 className={styles.sectionTitle}>Hecho por alguien que vio el problema de cerca</h2>

      <div className={styles.aboutGrid}>
        <div className={styles.aboutText}>
          <p>
            FiloDesk nació de una conversación real con un dueño de barbería que llevaba
            sus cuentas en un cuaderno y una hoja de Excel que nadie entendía.
          </p>
          <p>
            Vimos que el problema no era la voluntad — era que no existía una herramienta
            simple, pensada para barberías argentinas, que resolviera lo que más duele:
            saber cuánto generó cada barbero y cuánto te queda a vos al final del día.
          </p>
          <p>
            Somos un equipo pequeño, con foco total en un solo producto. Sin distracciones,
            sin funciones de relleno. Solo lo que necesita una barbería para funcionar bien.
          </p>
        </div>

        <div className={styles.aboutCards}>
          <div className={styles.aboutCard}>
            <span className={styles.aboutCardIcon}>💈</span>
            <h3>Pensado para barberías</h3>
            <p>No es un sistema genérico adaptado. Está construido desde cero para este rubro.</p>
          </div>
          <div className={styles.aboutCard}>
            <span className={styles.aboutCardIcon}>🇦🇷</span>
            <h3>100% argentino</h3>
            <p>Precios en pesos, cobro por Mercado Pago y soporte en el mismo huso horario.</p>
          </div>
          <div className={styles.aboutCard}>
            <span className={styles.aboutCardIcon}>🚀</span>
            <h3>En constante mejora</h3>
            <p>Cada nueva función la decidimos junto a los dueños que usan FiloDesk todos los días.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
