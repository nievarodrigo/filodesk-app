'use client'

import { useState, useTransition } from 'react'
import { updateServicioPrice, toggleServicio, deleteServicio } from '@/app/actions/servicio'
import styles from './servicios.module.css'

interface Service {
  id: string
  name: string
  default_price: number | null
  active: boolean
  barbershop_id: string | null
}

interface Props {
  barbershopId: string
  services: Service[]
}

export default function ServiciosTable({ barbershopId, services }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(services.map(s => [s.id, String(s.default_price ?? '')]))
  )
  const [pending, startTransition] = useTransition()

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  function handlePriceChange(id: string, value: string) {
    setPrices(prev => ({ ...prev, [id]: value }))
  }

  function handleSaveChanges() {
    startTransition(async () => {
      for (const serviceId of selectedIds) {
        const service = services.find(s => s.id === serviceId)
        if (service) {
          const newPrice = prices[service.id]
          const oldPrice = String(service.default_price ?? '')
          if (newPrice !== oldPrice) {
            await updateServicioPrice(barbershopId, service.id, Number(newPrice))
          }
        }
      }
      setIsEditing(false)
      setSelectedIds(new Set())
    })
  }

  function handleCancel() {
    setPrices(Object.fromEntries(services.map(s => [s.id, String(s.default_price ?? '')])))
    setIsEditing(false)
    setSelectedIds(new Set())
  }

  function handleToggle(serviceId: string, newActive: boolean) {
    startTransition(() => toggleServicio(barbershopId, serviceId, newActive))
  }

  function handleDelete(serviceId: string, name: string) {
    if (!confirm(`¿Eliminar el servicio "${name}"?`)) return
    startTransition(async () => {
      const result = await deleteServicio(barbershopId, serviceId)
      if (result?.error) alert(result.error)
    })
  }

  return (
    <>
      <div className={styles.tableControls}>
        {isEditing ? (
          <div className={styles.headerButtons}>
            <button className={styles.btnPrimary} onClick={handleSaveChanges} disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar precios'}
            </button>
            <button className={styles.btnSecondary} onClick={handleCancel} disabled={pending}>
              Cancelar
            </button>
          </div>
        ) : (
          <button className={styles.btnPrimary} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: '160px' }} onClick={() => setIsEditing(true)}>
            Editar precios
          </button>
        )}
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          {isEditing && <span style={{ width: '40px', textAlign: 'center' }}>✓</span>}
          <span>Nombre</span>
          <span style={{ textAlign: 'center' }}>Precio</span>
          <span style={{ textAlign: 'center' }}>Estado</span>
          <span style={{ textAlign: 'right' }}>Acciones</span>
        </div>

        {!services || services.length === 0 ? (
          <div className={styles.empty}>No hay servicios todavía.</div>
        ) : (
          services.map(s => {
            const isSelected = selectedIds.has(s.id)
            const canEdit = isEditing && isSelected
            return (
              <div key={s.id} className={styles.tableRow} style={canEdit ? { background: 'rgba(212, 168, 42, 0.08)' } : {}}>
                {isEditing && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(s.id)}
                    style={{ width: '40px', cursor: 'pointer', accentColor: 'var(--gold)' }}
                  />
                )}
                <span className={styles.cellName}>
                  {s.name}
                  {s.barbershop_id === null && <span className={styles.tagGlobal}>global</span>}
                </span>

                <span className={styles.cellPrice}>
                  {canEdit ? (
                    <div className={styles.priceEdit}>
                      <span className={styles.prefix}>$</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        className={styles.priceInput}
                        value={prices[s.id]}
                        onChange={e => handlePriceChange(s.id, e.target.value)}
                        disabled={pending}
                      />
                    </div>
                  ) : (
                    <span className={styles.priceValue}>
                      {s.default_price != null ? `$${Number(s.default_price).toLocaleString('es-AR')}` : '—'}
                    </span>
                  )}
                </span>

                <span className={styles.cellStatus}>
                  <span className={s.active ? styles.badgeActive : styles.badgeInactive}>
                    {s.active ? 'Activo' : 'Inactivo'}
                  </span>
                </span>

                <div className={styles.cellActions}>
                  {!isEditing && (
                    <>
                      <button className={s.active ? styles.btnToggleOff : styles.btnToggleOn} disabled={pending} onClick={() => handleToggle(s.id, !s.active)}>
                        {s.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button className={styles.btnDelete} disabled={pending} onClick={() => handleDelete(s.id, s.name)}>
                        ✕
                      </button>
                    </>
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
