'use client'

import { useTransition } from 'react'
import { deleteGasto } from '@/app/actions/gasto'
import styles from './gastos.module.css'

export default function DeleteGastoButton({ barbershopId, id }: { barbershopId: string; id: string }) {
  const [pending, start] = useTransition()
  return (
    <button className={styles.btnDelete} disabled={pending}
      onClick={() => { if (confirm('¿Eliminar este gasto?')) start(() => deleteGasto(barbershopId, id)) }}>
      {pending ? '…' : '✕'}
    </button>
  )
}
