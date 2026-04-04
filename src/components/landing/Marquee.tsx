import styles from './landing.module.css'

const ITEMS = [
  'The Barbers CABA',
  'OldSchool Barbershop',
  'Knife & Comb',
  'Don Ariel Barber',
  'La Navaja',
  'Barbería Del Centro',
]

function MarqueeStrip() {
  return (
    <div className={styles.marqueeTrack} aria-hidden>
      <span className={styles.marqueeText}>YA USAN FILODESK:</span>
      {ITEMS.map(item => (
        <span key={item} className={styles.marqueeText}>
          <span className={styles.marqueeSep}>·</span>
          {item}
        </span>
      ))}
      {/* Duplicate for seamless loop */}
      <span className={styles.marqueeText}>YA USAN FILODESK:</span>
      {ITEMS.map(item => (
        <span key={`dup-${item}`} className={styles.marqueeText}>
          <span className={styles.marqueeSep}>·</span>
          {item}
        </span>
      ))}
    </div>
  )
}

export default function Marquee() {
  return (
    <section className={styles.marqueeSection} aria-label="Barberías que usan FiloDesk">
      <MarqueeStrip />
    </section>
  )
}
