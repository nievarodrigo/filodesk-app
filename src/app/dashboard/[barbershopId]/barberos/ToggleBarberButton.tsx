'use client'

import { useTransition } from 'react'
import { toggleBarberActive } from '@/app/actions/barber'
import styles from './barberos.module.css'

interface Props {
  barbershopId: string
  barberId: string
  active: boolean
}

export default function ToggleBarberButton({ barbershopId, barberId, active }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      className={active ? styles.btnToggleOff : styles.btnToggleOn}
      disabled={pending}
      onClick={() =>
        startTransition(() => toggleBarberActive(barbershopId, barberId, !active))
      }
    >
      {active ? 'Desactivar' : 'Activar'}
    </button>
  )
}
