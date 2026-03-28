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
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null)
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
      setFocusedRowId(null)
    })
  }

  function handleCancel() {
    setCommissions(Object.fromEntries(barbers.map(b => [b.id, String(b.commission_pct ?? '')])))
    setIsEditing(false)
    setFocusedRowId(null)
  }

  function handleToggle(barberId: string, newActive: boolean) {
    startTransition(() => toggleBarberActive(barbershopId, barberId, newActive))
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px', marginTop: '-60px' }}>
        {isEditing ? (
          <>
            <button className={styles.btnPrimary} onClick={handleSaveChanges} disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar comisiones'}
            </button>
            <button className={styles.btnSecondary} onClick={handleCancel} disabled={pending}>
              Cancelar
            </button>
          </>
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
          <div className={styles.empty}>
            Todavía no hay barberos. Agregá el primero arriba.
          </div>
        ) : (
          barbers.map(barber => {
            const isFocused = focusedRowId === barber.id
            return (
              <div
                key={barber.id}
                className={styles.tableRow}
                style={isEditing && isFocused ? { background: 'rgba(212, 168, 42, 0.12)', borderLeft: '3px solid var(--gold)' } : {}}
              >
                <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{barber.name}</span>

                <span style={{ textAlign: 'center' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="100"
                        step="1"
                        style={{ width: '60px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--gold)', color: 'var(--text)', borderRadius: '4px', padding: '4px' }}
                        value={commissions[barber.id]}
                        onChange={e => handleCommissionChange(barber.id, e.target.value)}
                        onFocus={() => setFocusedRowId(barber.id)}
                        onBlur={() => setFocusedRowId(null)}
                        disabled={pending}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>%</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{barber.commission_pct ?? 0}%</span>
                  )}
                </span>

                <span style={{ textAlign: 'center' }}>
                  <span className={barber.active ? styles.badgeActive : styles.badgeInactive}>
                    {barber.active ? 'Activo' : 'Inactivo'}
                  </span>
                </span>

                <div className={styles.btnActions} style={{ justifyContent: 'flex-end' }}>
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
            )
          })
        )}
      </div>
    </>
  )
}
