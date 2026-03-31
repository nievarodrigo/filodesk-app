import Link from 'next/link'
import styles from './landing.module.css'

const plans = [
  {
    name: 'Base',
    price: '11.999',
    sub: '14 días gratis · Cancelás cuando querés',
    cta: 'Empezar gratis',
    href: '/auth/register',
    disabled: false,
    highlight: false,
    features: [
      'Hasta 6 barberos',
      'Registro de ventas y servicios',
      'Comisiones calculadas automáticamente',
      'Control de gastos del local',
      'Ganancia neta real (ingresos menos gastos y comisiones)',
      'Nóminas del equipo',
      'Agenda de turnos',
      'Control de stock con alertas de reposición',
      'Gráficos de ventas mensuales',
      'Funciona desde el celular, sin instalar nada',
      'Soporte por WhatsApp',
    ],
  },
  {
    name: 'Pro',
    price: '19.999',
    sub: 'En desarrollo — disponible pronto',
    cta: 'Próximamente',
    href: '#',
    disabled: true,
    highlight: true,
    badge: 'Próximamente',
    features: [
      'Barberos ilimitados',
      'Todo lo del plan Base',
      'Múltiples usuarios con acceso al dashboard',
      'Rol Encargado — gestiona el local sin ver finanzas',
      'Rol Barbero — solo registra sus propios servicios',
      'Exportar reportes en CSV',
      'Soporte prioritario',
    ],
  },
]

export default function Pricing() {
  return (
    <section id="precio" className={styles.section}>
      <div className={styles.sectionLabel}>Planes</div>
      <div className={styles.sectionTitle}>Elegí el plan que necesitás</div>
      <div className={styles.sectionSub}>
        Todos los planes incluyen 14 días gratis. Pagás con tarjeta, débito o transferencia vía Mercado Pago.
      </div>

      <div className={styles.pricingGrid}>
        {plans.map((plan) => {
          return (
            <div
              key={plan.name}
              className={`${styles.pricingCard} ${plan.highlight ? styles.pricingCardHighlight : ''}`}
            >
              {/* Top accent bar */}
              <div
                className={styles.pricingAccent}
                style={plan.highlight ? { background: 'var(--blue)' } : undefined}
              />

              {/* Badge */}
              {plan.badge ? (
                <div className={styles.pricingBadge}>{plan.badge}</div>
              ) : (
                <div className={styles.pricingBadge}>{plan.name}</div>
              )}

              {/* Price */}
              <div className={styles.pricingPrice}>
                ${plan.price} <span>ARS/mes</span>
              </div>
              <div className={styles.pricingSub}>{plan.sub}</div>

              {/* Features */}
              <ul className={styles.pricingFeatures}>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              {/* CTA */}
              {plan.disabled ? (
                <button
                  className={`${styles.btn} ${styles.btnLg}`}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--muted)',
                    opacity: 0.7,
                  }}
                  disabled
                >
                  {plan.cta}
                </button>
              ) : (
                <Link href={plan.href} style={{ display: 'block' }}>
                  <button
                    className={`${styles.btn} ${styles.btnLg}`}
                    style={plan.highlight ? { width: '100%', background: 'var(--blue)', color: '#fff' } : { width: '100%' }}
                  >
                    {plan.cta}
                  </button>
                </Link>
              )}

              <div className={styles.pricingNote}>
                {plan.disabled ? 'En desarrollo — disponible pronto' : 'Sin compromiso, cancelás cuando querés'}
              </div>
            </div>
          )
        })}
      </div>

    </section>
  )
}
