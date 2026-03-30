'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './UpgradeModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  barbershopId: string
}

export default function UpgradeModal({ isOpen, onClose, barbershopId }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        <div className={styles.header}>
          <h2 id="upgrade-modal-title" className={styles.title}>Desbloqueá todo el potencial</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <p className={styles.text}>
          Con Plan Pro liberás herramientas clave para administrar tu barbería con más control y velocidad.
        </p>

        <ul className={styles.list}>
          <li className={styles.item}>✅ Exportación a Excel/CSV</li>
          <li className={styles.item}>✅ Gestión de equipo ilimitada</li>
          <li className={styles.item}>✅ Roles avanzados (Manager/Barbero)</li>
        </ul>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.ctaBtn}
            onClick={() => router.push(`/suscripcion?barbershopId=${barbershopId}`)}
          >
            Mejorar a Plan Pro
          </button>
          <button type="button" className={styles.ghostBtn} onClick={onClose}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
