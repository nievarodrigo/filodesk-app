'use client'

import { useState, useTransition } from 'react'
import { toggleBarberActive } from '@/app/actions/barber'
import styles from './barberos-card.module.css'

interface Barber {
  id: string
  name: string
  commission_pct: number
  active: boolean
}

interface Props {
  barbershopId: string
  barbers: Barber[]
}

export default function BarberosCard({ barbershopId, barbers }: Props) {
  const [open, setOpen] = useState(false)
  const activeCount = barbers.filter(b => b.active).length

  return (
    <>
      <div className={styles.compactBar}>
        <div className={styles.compactLeft}>
          <div className={styles.statusDot} />
          <span className={styles.compactText}>
            <strong className={styles.compactStrong}>{activeCount}</strong>
            {' '}barbero{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          className={styles.manageBtn}
          onClick={() => setOpen(true)}
        >
          Gestionar
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className={styles.backdrop}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={styles.modal}
          >
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle}>Barberos</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={styles.closeBtn}
                aria-label="Cerrar gestión de barberos"
              >
                ✕
              </button>
            </div>

            <div className={styles.list}>
              {barbers.map(b => (
                <BarberRow key={b.id} barbershopId={barbershopId} barber={b} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function BarberRow({ barbershopId, barber }: { barbershopId: string; barber: Barber }) {
  const [pending, start] = useTransition()

  return (
    <details className={`${styles.row} ${barber.active ? '' : styles.rowInactive}`}>
      <summary className={styles.rowSummary}>
        <div className={styles.rowIdentity}>
          <div className={`${styles.rowDot} ${barber.active ? styles.rowDotActive : styles.rowDotInactive}`} />
          <div>
            <p className={styles.rowName}>{barber.name}</p>
            <p className={styles.rowMeta}>{barber.commission_pct}% comisión</p>
          </div>
        </div>
        <span className={styles.rowChevron} aria-hidden>▾</span>
      </summary>
      <div className={styles.rowBody}>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => { toggleBarberActive(barbershopId, barber.id, !barber.active) })}
          className={barber.active ? styles.toggleOff : styles.toggleOn}
        >
          {pending ? '…' : barber.active ? 'Desactivar' : 'Reactivar'}
        </button>
      </div>
    </details>
  )
}
