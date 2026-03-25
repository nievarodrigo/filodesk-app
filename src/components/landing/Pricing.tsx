import Link from 'next/link'
import styles from './landing.module.css'

const plans = [
  {
    name: 'Base',
    price: '12.000',
    sub: '14 días gratis · Cancelás cuando querés',
    cta: 'Empezar gratis',
    href: '/auth/register',
    disabled: false,
    highlight: false,
    features: [
      ' 1 barbería',
      'Hasta 5 barberos',
      'Dashboard en tiempo real',
      'Control de caja y gastos',
      'Registro de ventas y productos',
      'Liquidación de sueldos automática',
      'Gráficos básicos',
      'Historial de 3 meses',
      'Soporte por WhatsApp',
    ],
  },
  {
    name: 'Pro',
    price: '20.000',
    sub: '14 días gratis · Cancelás cuando querés',
    cta: 'Empezar gratis',
    href: '/auth/register',
    disabled: false,
    highlight: true,
    badge: 'Más popular',
    features: [
      'Hasta 5 barberías',
      'Barberos ilimitados',
      'Todo lo del plan Base',
      'Roles: Dueño, Encargado y Barbero',
      'Historial completo',
      'Gráficos y estadísticas avanzadas',
      'Exportar reportes (Excel/PDF)',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Premium IA',
    price: '30.000',
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
                    border: '1px solid var(--green)',
                    color: 'var(--green)',
                    opacity: 0.8,
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

      {/* Roles explanation */}
      <div className={styles.pricingRoles}>
        <div className={styles.pricingRolesTitle}>Roles disponibles en Pro y Premium</div>
        <div className={styles.pricingRolesGrid}>
          <div className={styles.pricingRole}>
            <strong>Dueño</strong>
            <span>Acceso total a todas las funciones</span>
          </div>
          <div className={styles.pricingRole}>
            <strong>Encargado</strong>
            <span>Gestiona barberos, productos y ventas. No ve finanzas</span>
          </div>
          <div className={styles.pricingRole}>
            <strong>Barbero</strong>
            <span>Solo registra sus servicios terminados</span>
          </div>
        </div>
      </div>
    </section>
  )
}
