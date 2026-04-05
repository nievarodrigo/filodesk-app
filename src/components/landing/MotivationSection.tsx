import styles from './landing.module.css'
import AnimateOnScroll from './AnimateOnScroll'

export default function MotivationSection() {
  return (
    <section className={styles.motivationSection}>
      <div className={styles.motivationContainer}>
        <div className={styles.motivationGrid}>
          {/* Text Content */}
          <div className={styles.motivationText}>
            <AnimateOnScroll>
              <h2 className={styles.sectionH2}>
                Motivación que se <span className={styles.visualAccent}>traduce</span> en ventas.
              </h2>
              <p className={styles.sectionP}>
                Inspirado en los estándares de las mejores barberías de Europa, FiloDesk no es solo un sistema de gestión; es el motor de tu equipo.
              </p>
              <ul className={styles.motivationList}>
                <li>
                  <span className={styles.iconYes}>✓</span>
                  <div>
                    <strong>Gamificación en tiempo real:</strong>
                    Festivales de logros y metas diarias que motivan a tus barberos a superar sus propios récords.
                  </div>
                </li>
                <li>
                  <span className={styles.iconYes}>✓</span>
                  <div>
                    <strong>Transparencia total:</strong>
                    Tus barberos ven sus comisiones al instante, eliminando dudas y fortaleciendo la confianza.
                  </div>
                </li>
                <li>
                  <span className={styles.iconYes}>✓</span>
                  <div>
                    <strong>Control B2C:</strong>
                    Preparate para el siguiente nivel: un marketplace donde los clientes te encuentran y reservan solos.
                  </div>
                </li>
              </ul>
            </AnimateOnScroll>
          </div>

          {/* Visual Effect / Card */}
          <div className={styles.motivationVisual}>
            <AnimateOnScroll delay={200} className={styles.casinoCard}>
              <div className={styles.casinoHeader}>
                <span className={styles.casinoIcon}>🏆</span>
                <p>¡Nuevo Récord!</p>
              </div>
              <div className={styles.casinoBody}>
                <p className={styles.casinoMainText}>Superaste tu promedio de los martes</p>
                <div className={styles.casinoProgress}>
                  <div className={styles.casinoProgressBar} style={{ width: '85%' }}></div>
                </div>
                <p className={styles.casinoSubText}>+ $12.500 en comisiones hoy</p>
              </div>
              <div className={styles.casinoFooter}>
                <span className={styles.casinoSparkle}>✨</span>
                <span>Efecto FiloDesk</span>
                <span className={styles.casinoSparkle}>✨</span>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </div>
    </section>
  )
}
