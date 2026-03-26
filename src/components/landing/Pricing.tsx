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
      '1 barbería por cuenta',
      'Barberos ilimitados',
      'Dashboard con ingresos y ventas en tiempo real',
      'Comisiones calculadas automáticamente',
      'Ganancia neta descontando gastos y comisiones',
      'Registro de servicios y productos',
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
    cta: 'Anotarme en lista de espera',
    href: '#',
    disabled: true,
    highlight: true,
    badge: 'Próximamente',
    features: [
      '1 barbería por cuenta',
      'Todo lo del plan Base',
      'Rol Dueño — acceso total',
      'Rol Encargado — gestiona sin ver finanzas',
      'Rol Barbero — registra sus servicios',
      'Historial completo sin límite',
      'Gráficos y estadísticas avanzadas',
      'Exportar reportes (Excel/PDF)',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Premium IA',
    price: '29.999',
    sub: 'En desarrollo — disponible pronto',
    cta: 'Anotarme en lista de espera',
    href: '#',
    disabled: true,
    highlight: false,
    accent: 'green' as const,
    features: [
      'Barberías ilimitadas',
      'Todo lo del plan Pro',
      'Predicción de demanda por día y horario',
      'Alertas automáticas de caída de ingresos',
      'Sugerencias de inversión en publicidad',
      'Detección de barberos con bajo rendimiento',
      'Recomendaciones de precios por temporada',
      'Asistente IA personalizado',
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
          const isGreen = plan.accent === 'green'
          return (
            <div
              key={plan.name}
              className={`${styles.pricingCard} ${plan.highlight ? styles.pricingCardHighlight : ''}`}
            >
              {/* Top accent bar */}
              <div
                className={styles.pricingAccent}
                style={
                  isGreen
                    ? { background: 'linear-gradient(to right, var(--gold), var(--green))' }
                    : plan.highlight
                      ? { background: 'var(--blue)' }
                      : undefined
                }
              />

              {/* Badge */}
              {plan.badge && (
                <div className={styles.pricingBadge}>{plan.badge}</div>
              )}
              {isGreen && (
                <div className={styles.pricingBadge} style={{ background: 'linear-gradient(135deg, var(--gold), var(--green))' }}>
                  Próximamente
                </div>
              )}
              {!plan.badge && !isGreen && (
                <div className={styles.pricingBadge}>{plan.name}</div>
              )}

              {/* Price */}
              <div className={styles.pricingPrice} style={isGreen ? { color: 'var(--green)' } : undefined}>
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
