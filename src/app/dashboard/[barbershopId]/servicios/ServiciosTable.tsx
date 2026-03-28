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
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(services.map(s => [s.id, String(s.default_price ?? '')]))
  )
  const [pending, startTransition] = useTransition()

  function handlePriceChange(id: string, value: string) {
    setPrices(prev => ({ ...prev, [id]: value }))
  }

  function handleSaveChanges() {
    startTransition(async () => {
      // Actualizar solo los servicios cuyo precio cambió
      for (const service of services) {
        const newPrice = prices[service.id]
        const oldPrice = String(service.default_price ?? '')
        if (newPrice !== oldPrice) {
          await updateServicioPrice(barbershopId, service.id, Number(newPrice))
        }
      }
      setIsEditing(false)
    })
  }

  function handleCancel() {
    setPrices(Object.fromEntries(services.map(s => [s.id, String(s.default_price ?? '')])))
    setIsEditing(false)
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

  const isGlobal = (barbershopId: string | null) => barbershopId === null

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
            Editar precios
          </button>
        )}
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Nombre</span>
          <span>Precio</span>
          <span>Estado</span>
          <span></span>
        </div>

        {!services || services.length === 0 ? (
          <div className={styles.empty}>No hay servicios todavía.</div>
        ) : (
          services.map(s => (
            <div key={s.id} className={styles.tableRow}>
              <span>
                {s.name}
                {isGlobal(s.barbershop_id) && <span className={styles.tagGlobal}>global</span>}
              </span>

              <span>
                {isEditing ? (
                  <div className={styles.priceEdit}>
                    <span className={styles.prefix}>$</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      className={styles.priceInput}
                      value={prices[s.id]}
                      onChange={e => handlePriceChange(s.id, e.target.value)}
                      disabled={pending}
                    />
                  </div>
                ) : (
                  <span>
                    {s.default_price != null
                      ? `$${Number(s.default_price).toLocaleString('es-AR')}`
                      : <span className={styles.noPrice}>sin precio</span>}
                  </span>
                )}
              </span>

              <span>
                <span className={s.active ? styles.badgeActive : styles.badgeInactive}>
                  {s.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>

              {!isEditing && (
                <div className={styles.btnActions}>
                  <button
                    className={s.active ? styles.btnToggleOff : styles.btnToggleOn}
                    disabled={pending}
                    onClick={() => handleToggle(s.id, !s.active)}
                  >
                    {s.active ? 'Desactivar' : 'Activar'}
                  </button>
                  {!isGlobal(s.barbershop_id) && (
                    <button
                      className={styles.btnDelete}
                      disabled={pending}
                      onClick={() => handleDelete(s.id, s.name)}
                      title="Eliminar servicio"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}
