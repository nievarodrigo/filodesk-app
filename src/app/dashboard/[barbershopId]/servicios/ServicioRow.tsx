'use client'

import { useTransition } from 'react'
import { toggleServicio, deleteServicio } from '@/app/actions/servicio'
import styles from './servicios.module.css'

interface Props {
  barbershopId: string
  service: {
    id: string
    name: string
    default_price: number | null
    active: boolean
    barbershop_id: string | null
  }
}

export default function ServicioRow({ barbershopId, service }: Props) {
  const [pending, startTransition] = useTransition()

  const isGlobal = service.barbershop_id === null

  function handleDelete() {
    if (!confirm(`¿Eliminar el servicio "${service.name}"?`)) return
    startTransition(async () => {
      const result = await deleteServicio(barbershopId, service.id)
      if (result?.error) alert(result.error)
    })
  }

  return (
    <div className={styles.tableRow}>
      <span>
        {service.name}
        {isGlobal && <span className={styles.tagGlobal}>global</span>}
      </span>

      <span>
        {service.default_price != null
          ? `$${Number(service.default_price).toLocaleString('es-AR')}`
          : <span className={styles.noPrice}>sin precio</span>}
      </span>

      <span>
        <span className={service.active ? styles.badgeActive : styles.badgeInactive}>
          {service.active ? 'Activo' : 'Inactivo'}
        </span>
      </span>

      <div className={styles.btnActions}>
        <button
          className={service.active ? styles.btnToggleOff : styles.btnToggleOn}
          disabled={pending}
          onClick={() => startTransition(() => toggleServicio(barbershopId, service.id, !service.active))}
        >
          {service.active ? 'Desactivar' : 'Activar'}
        </button>
        {!isGlobal && (
          <button
            className={styles.btnDelete}
            disabled={pending}
            onClick={handleDelete}
            title="Eliminar servicio"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
