import Link from 'next/link'
import styles from './landing.module.css'

const basePlanFeatures = [
  'Dashboard completo en tiempo real',
  'Barberos ilimitados',
  'Liquidación de sueldos automática',
  'Control de caja y gastos',
  'Registro de ventas (servicios, productos, café)',
  'Gráficos de ventas semanales',
  'Funciona desde el celular, sin instalar nada',
  'Soporte por WhatsApp',
]

const premiumFeatures = [
  'Todo lo del plan base',
  'Predicción de días y horarios de mayor demanda',
  'Alertas automáticas de caída de ingresos',
  'Sugerencias de cuándo invertir en publicidad',
  'Detección de barberos con bajo rendimiento',
  'Recomendaciones de precios por temporada',
]

export default function Pricing() {
  return (
    <section id="precio" className={styles.section}>
      <div className={styles.sectionLabel}>Precio</div>
      <div className={styles.sectionTitle}>Simple y directo</div>
      <div className={styles.sectionSub}>Un solo plan con todo incluido. Sin sorpresas.</div>

      <div className={styles.pricingGrid}>

        {/* Plan base */}
        <div className={styles.pricingCard}>
          <div className={styles.pricingBadge}>Plan completo</div>
          <div className={styles.pricingPrice}>$12.000 <span>ARS/mes</span></div>
          <div className={styles.pricingSub}>Primeros 14 días gratis, cancelás cuando querés</div>

          <ul className={styles.pricingFeatures}>
            {basePlanFeatures.map((f) => <li key={f}>{f}</li>)}
          </ul>

          <Link href="/auth/register" style={{ display: 'block' }}>
            <button className={`${styles.btn} ${styles.btnLg}`} style={{ width: '100%' }}>
              Empezar 14 días gratis
            </button>
          </Link>
          <div className={styles.pricingNote}>Pagás con tarjeta, débito o transferencia vía Mercado Pago</div>
        </div>

        {/* Plan Premium IA */}
        <div className={styles.pricingCard} style={{
          borderColor: 'rgba(94,207,135,.4)',
          boxShadow: '0 0 60px rgba(94,207,135,.07)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(to right, var(--gold), #5ecf87)',
          }} />
          <div className={styles.pricingBadge} style={{ background: 'linear-gradient(135deg, var(--gold), #5ecf87)' }}>
            Próximamente
          </div>
          <div style={{ fontSize: '.82rem', color: '#5ecf87', fontWeight: 600, marginBottom: '10px', letterSpacing: '.5px' }}>
            ✦ FiloDesk Premium con IA
          </div>
          <div className={styles.pricingPrice} style={{ color: '#5ecf87' }}>$30.000 <span>ARS/mes</span></div>
          <div className={styles.pricingSub}>Todo el plan base, más inteligencia artificial</div>

          <div style={{
            background: 'rgba(94,207,135,.06)', border: '1px solid rgba(94,207,135,.15)',
            borderRadius: '10px', padding: '16px', marginBottom: '24px',
          }}>
            <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--cream)', lineHeight: 1.5, fontStyle: 'italic' }}>
              "Ahora no solo manejás tu barbería,<br />la potenciás."
            </div>
          </div>

          <ul className={styles.pricingFeatures}>
            {premiumFeatures.map((f, i) => (
              <li key={f} style={i > 0 ? { color: '#5ecf87' } : {}}>{f}</li>
            ))}
          </ul>

          <button
            className={`${styles.btn} ${styles.btnLg}`}
            style={{ width: '100%', background: 'transparent', border: '1px solid #5ecf87', color: '#5ecf87', opacity: .8 }}
            disabled
          >
            Anotarme en lista de espera
          </button>
          <div className={styles.pricingNote}>En desarrollo — disponible pronto</div>
        </div>

      </div>
    </section>
  )
}
