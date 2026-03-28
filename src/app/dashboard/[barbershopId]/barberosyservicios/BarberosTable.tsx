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
      <div className={styles.tableControls}>
        {isEditing ? (
          <div className={styles.headerButtons}>
            <button className={styles.btnPrimary} onClick={handleSaveChanges} disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar comisiones'}
            </button>
            <button className={styles.btnSecondary} onClick={handleCancel} disabled={pending}>
              Cancelar
            </button>
          </div>
        ) : (
          <button className={styles.btnPrimary} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: '160px' }} onClick={() => setIsEditing(true)}>
            Editar comisiones
          </button>
        )}
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Nombre</span>
          <span style={{ textAlign: 'center' }}>Comisión</span>
          <span style={{ textAlign: 'center' }}>Estado</span>
          <span style={{ textAlign: 'right' }}>Acciones</span>
        </div>

        {!barbers || barbers.length === 0 ? (
          <div className={styles.empty}>Todavía no hay barberos. Agregá el primero arriba.</div>
        ) : (
          barbers.map(barber => (
            <div key={barber.id} className={styles.tableRow}>
              <span className={styles.cellName}>{barber.name}</span>

              <span className={styles.cellCommission}>
                {isEditing ? (
                  <div className={styles.commissionEdit}>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="100"
                      step="1"
                      className={styles.commissionInput}
                      value={commissions[barber.id]}
                      onChange={e => handleCommissionChange(barber.id, e.target.value)}
                      disabled={pending}
                    />
                    <span className={styles.commissionSuffix}>%</span>
                  </div>
                ) : (
                  <span className={styles.commissionValue}>{barber.commission_pct ?? 0}%</span>
                )}
              </span>

              <span className={styles.cellStatus}>
                <span className={barber.active ? styles.badgeActive : styles.badgeInactive}>
                  {barber.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>

              <div className={styles.cellActions}>
                {!isEditing && (
                  <button
                    className={barber.active ? styles.btnToggleOff : styles.btnToggleOn}
                    disabled={pending}
                    onClick={() => handleToggle(barber.id, !barber.active)}
                  >
                    {barber.active ? 'Desactivar' : 'Activar'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
