'use client'

import { useState, useTransition } from 'react'
import { toggleBarberActive, updateBarberCommission } from '@/app/actions/barber'
import styles from './barberos.module.css'

interface Barber {
  id: string
  name: string
  commission_pct: number | null
  active: boolean
}

interface Props {
  barbershopId: string
  barbers: Barber[]
}

export default function BarberosTable({ barbershopId, barbers }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [commissions, setCommissions] = useState<Record<string, string>>(
    Object.fromEntries(barbers.map(b => [b.id, String(b.commission_pct ?? '')]))
  )
  const [pending, startTransition] = useTransition()

  function handleCommissionChange(id: string, value: string) {
    setCommissions(prev => ({ ...prev, [id]: value }))
  }

  function handleSaveChanges() {
    startTransition(async () => {
      for (const barber of barbers) {
        const newCommission = commissions[barber.id]
        const oldCommission = String(barber.commission_pct ?? '')
        if (newCommission !== oldCommission) {
          await updateBarberCommission(barbershopId, barber.id, Number(newCommission))
        }
      }
      setIsEditing(false)
    })
  }

  function handleCancel() {
    setCommissions(Object.fromEntries(barbers.map(b => [b.id, String(b.commission_pct ?? '')])))
    setIsEditing(false)
  }

  function handleToggle(barberId: string, newActive: boolean) {
    startTransition(() => toggleBarberActive(barbershopId, barberId, newActive))
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {isEditing ? (
          <>
            <button
              className={styles.btnPrimary}
              onClick={handleSaveChanges}
              disabled={pending}
            >
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              className={styles.btnSecondary}
              onClick={handleCancel}
              disabled={pending}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={() => setIsEditing(true)}
          >
            Editar comisiones
          </button>
        )}
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Nombre</span>
          <span>Comisión</span>
          <span>Estado</span>
          <span></span>
        </div>

        {!barbers || barbers.length === 0 ? (
          <div className={styles.empty}>
            Todavía no hay barberos. Agregá el primero arriba.
          </div>
        ) : (
          barbers.map(barber => (
            <div key={barber.id} className={styles.tableRow}>
              <span>{barber.name}</span>

              <span>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="100"
                      step="0.1"
                      className={styles.commissionInput}
                      value={commissions[barber.id]}
                      onChange={e => handleCommissionChange(barber.id, e.target.value)}
                      disabled={pending}
                    />
                    <span>%</span>
                  </div>
                ) : (
                  <span>{barber.commission_pct ?? 0}%</span>
                )}
              </span>

              <span>
                <span className={barber.active ? styles.badgeActive : styles.badgeInactive}>
                  {barber.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>

              {!isEditing && (
                <div className={styles.btnActions}>
                  <button
                    className={barber.active ? styles.btnToggleOff : styles.btnToggleOn}
                    disabled={pending}
                    onClick={() => handleToggle(barber.id, !barber.active)}
                  >
                    {barber.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}
