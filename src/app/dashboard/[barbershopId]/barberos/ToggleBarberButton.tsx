'use client'

import { useTransition } from 'react'
import { toggleBarberActive, deleteBarber } from '@/app/actions/barber'
import styles from './barberos.module.css'

interface Props {
  barbershopId: string
  barberId: string
  active: boolean
}

export default function ToggleBarberButton({ barbershopId, barberId, active }: Props) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('¿Eliminár este barbero? Solo es posible si no tiene ventas registradas.')) return
    startTransition(async () => {
      const result = await deleteBarber(barbershopId, barberId)
      if (result?.error) alert(result.error)
    })
  }

  return (
    <div className={styles.btnActions}>
      <button
        className={active ? styles.btnToggleOff : styles.btnToggleOn}
        disabled={pending}
        onClick={() => startTransition(() => toggleBarberActive(barbershopId, barberId, !active))}
      >
        {active ? 'Desactivar' : 'Activar'}
      </button>
      <button
        className={styles.btnDelete}
        disabled={pending}
        onClick={handleDelete}
        title="Eliminar barbero"
      >
        ✕
      </button>
    </div>
  )
}
