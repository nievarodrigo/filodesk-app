'use client'

import { useTransition } from 'react'
import { Check, Loader2, Trash2 } from 'lucide-react'
import { markNominaPaid, deleteNomina } from '@/app/actions/nomina'
import styles from './nominas.module.css'

interface Props { barbershopId: string; nominaId: string; status: string }

export default function NominaActions({ barbershopId, nominaId, status }: Props) {
  const [pending, start] = useTransition()

  return (
    <div className={styles.actionGroup}>
      {status === 'pending' && (
        <button
          className={styles.btnPay}
          disabled={pending}
          onClick={() => { if (confirm('¿Marcar como pagada?')) start(() => markNominaPaid(barbershopId, nominaId)) }}
          aria-label="Marcar nómina como pagada"
        >
          {pending ? <Loader2 size={14} className={styles.spinIcon} aria-hidden /> : <Check size={14} aria-hidden />}
          <span>Pagar</span>
        </button>
      )}
      <button
        className={styles.btnDelete}
        disabled={pending}
        onClick={() => { if (confirm('¿Eliminar esta nómina?')) start(() => deleteNomina(barbershopId, nominaId)) }}
        aria-label="Eliminar nómina"
      >
        {pending ? <Loader2 size={14} className={styles.spinIcon} aria-hidden /> : <Trash2 size={14} aria-hidden />}
        <span>Eliminar</span>
      </button>
    </div>
  )
}
