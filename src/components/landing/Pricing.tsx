import Link from 'next/link'
import styles from './landing.module.css'
import { CheckCircleIcon } from './LandingIcons'
import AnimateOnScroll from './AnimateOnScroll'

const PLANS = [
  {
    name: 'Base',
    price: '11.999',
    sub: '14 días gratis · Sin tarjeta de crédito',
    featured: false,
    features: [
      'Hasta 6 barberos',
      'Ventas, comisiones y nóminas automáticas',
      'Control de gastos y ganancia neta real',
      'Agenda de turnos y control de stock',
      'Gráficos de ventas mensuales',
      'Soporte por WhatsApp',
    ],
    cta: 'Empezar gratis 14 días',
    href: '/auth/register',
    disabled: false,
  },
  {
    name: 'Pro',
    price: '19.999',
    sub: 'En desarrollo — disponible pronto',
    featured: true,
    badge: 'Próximamente',
    features: [
      'Todo lo del plan Base',
      'Barberos ilimitados',
      'Múltiples usuarios en el dashboard',
      'Rol Encargado — gestiona sin ver finanzas',
      'Rol Barbero — solo registra sus servicios',
      'Exportar reportes en CSV',
    ],
    cta: 'Próximamente',
    href: '#',
    disabled: true,
  },
]

export default function Pricing() {
  return (
    <section id="precios" className={styles.pricingSection}>
      <AnimateOnScroll className={styles.sectionHeader}>
        <h2 className={styles.sectionH2}>
          Planes para cada <span className={styles.sectionH2Accent}>etapa</span>
        </h2>
        <p className={styles.sectionP}>
          Pagás con tarjeta, débito o transferencia vía Mercado Pago. Cancelás cuando querés.
        </p>
      </AnimateOnScroll>

      <div className={styles.pricingGrid2col}>
        {PLANS.map((plan, i) => (
          <AnimateOnScroll
            key={plan.name}
            className={`${styles.pricingCard} ${plan.featured ? styles.pricingCardFeatured : ''}`}
            delay={i * 120}
          >
            {plan.badge && <span className={styles.pricingBadge}>{plan.badge}</span>}

            <p className={styles.pricingName}>{plan.name}</p>

            <div className={styles.pricingPriceRow}>
              <span className={styles.pricingCurrencySymbol}>$</span>
              <span className={`${styles.pricingAmount} ${plan.featured ? styles.pricingAmountFeatured : ''}`}>
                {plan.price}
              </span>
              <span className={styles.pricingPeriod}>/mes ARS</span>
            </div>

            <p className={styles.pricingSub}>{plan.sub}</p>

            <ul className={styles.pricingList}>
              {plan.features.map(f => (
                <li key={f}>
                  <span className={styles.checkIcon}><CheckCircleIcon size={15} /></span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.disabled ? (
              <button className={styles.btnDisabled} disabled>{plan.cta}</button>
            ) : (
              <Link href={plan.href} style={{ display: 'block' }}>
                <button className={`${styles.btnPrimary} ${styles.btnBlock}`}>{plan.cta}</button>
              </Link>
            )}
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  )
}
