'use client'

import { useTransition } from 'react'
import { markNominaPaid, deleteNomina } from '@/app/actions/nomina'
import styles from './nominas.module.css'

interface Props { barbershopId: string; nominaId: string; status: string }

export default function NominaActions({ barbershopId, nominaId, status }: Props) {
  const [pending, start] = useTransition()

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      {status === 'pending' && (
        <button
          className={styles.btnPay}
          disabled={pending}
          onClick={() => { if (confirm('¿Marcar como pagada?')) start(() => markNominaPaid(barbershopId, nominaId)) }}
        >
          {pending ? '…' : '✓ Pagar'}
        </button>
      )}
      <button
        className={styles.btnDelete}
        disabled={pending}
        onClick={() => { if (confirm('¿Eliminar esta nómina?')) start(() => deleteNomina(barbershopId, nominaId)) }}
      >
        ✕
      </button>
    </div>
  )
}
