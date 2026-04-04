import styles from './landing.module.css'
import { PaymentsIcon, GroupIcon, InventoryIcon, PhoneIcon, TrendingUpIcon, CalendarIcon } from './LandingIcons'
import AnimateOnScroll from './AnimateOnScroll'

const FEATURES = [
  {
    Icon: PaymentsIcon,
    iconClass: 'bentoIconGold' as const,
    title: 'Ventas y Cobros',
    desc: 'Registrá cada servicio en segundos. FiloDesk calcula comisiones y actualiza los números al instante — sin planillas, sin errores.',
  },
  {
    Icon: GroupIcon,
    iconClass: 'bentoIconRed' as const,
    title: 'Nóminas y Comisiones',
    desc: 'Configurás el porcentaje de cada barbero una sola vez. Cada venta le suma comisión automáticamente. Tu equipo lo ve en tiempo real.',
  },
  {
    Icon: InventoryIcon,
    iconClass: 'bentoIconTert' as const,
    title: 'Stock e Inventario',
    desc: 'Vendé tus productos desde el sistema. Cada venta descuenta el stock automáticamente y recibís alertas cuando queda poco.',
  },
  {
    Icon: TrendingUpIcon,
    iconClass: 'bentoIconGold' as const,
    title: 'Tu ganancia real del mes',
    desc: 'Ingresos menos comisiones menos gastos: el número que importa, calculado en automático. Sin planillas, sin estimaciones.',
  },
  {
    Icon: CalendarIcon,
    iconClass: 'bentoIconRed' as const,
    title: 'Agenda de turnos',
    desc: 'Organizá los turnos de cada barbero en una grilla visual por día. Para las barberías que trabajan con reservas.',
  },
  {
    Icon: PhoneIcon,
    iconClass: 'bentoIconTert' as const,
    title: 'Desde el celular, sin instalar nada',
    desc: 'Abrís FiloDesk desde el navegador del celu y funciona igual que en la compu. Sin descargas, sin actualizaciones manuales.',
  },
]

export default function Features() {
  return (
    <section id="funciones" className={styles.featuresSection}>
      <AnimateOnScroll className={styles.sectionHeader}>
        <h2 className={styles.sectionH2}>
          Herramientas de <span className={styles.sectionH2Accent}>élite</span>
        </h2>
        <p className={styles.sectionP}>
          Diseñado para la agilidad de una barbería moderna. Sin complicaciones, sin planillas, sin perder tiempo.
        </p>
      </AnimateOnScroll>

      <div className={styles.bentoGrid}>
        {FEATURES.map(({ Icon, iconClass, title, desc }, i) => (
          <AnimateOnScroll key={title} className={styles.bentoCard} delay={i * 80}>
            <div className={`${styles.bentoIconWrap} ${styles[iconClass]}`}>
              <Icon size={30} />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  )
}
