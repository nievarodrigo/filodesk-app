'use client'

import { useTransition } from 'react'
import { deleteVenta } from '@/app/actions/venta'
import styles from './ventas.module.css'

interface Props {
  barbershopId: string
  saleId: string
}

export default function DeleteVentaButton({ barbershopId, saleId }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      className={styles.btnDelete}
      disabled={pending}
      onClick={() => {
        if (confirm('¿Eliminar esta venta?')) {
          startTransition(() => { deleteVenta(barbershopId, saleId) })
        }
      }}
    >
      {pending ? '…' : '✕'}
    </button>
  )
}
