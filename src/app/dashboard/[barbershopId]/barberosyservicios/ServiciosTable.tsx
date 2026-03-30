'use client'

import { useState, useTransition } from 'react'
import { Check, Pencil, X } from 'lucide-react'
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
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(services.map(s => [s.id, String(s.default_price ?? '')]))
  )
  const [pending, startTransition] = useTransition()

  function handlePriceChange(id: string, value: string) {
    setPrices(prev => ({ ...prev, [id]: value }))
  }

  function handleStartEdit(service: Service) {
    setPrices(prev => ({ ...prev, [service.id]: String(service.default_price ?? '') }))
    setEditingServiceId(service.id)
  }

  function handleCancelEdit(service: Service) {
    setPrices(prev => ({ ...prev, [service.id]: String(service.default_price ?? '') }))
    setEditingServiceId(null)
  }

  function handleSaveService(service: Service) {
    const rawPrice = prices[service.id]
    const parsedPrice = Number(rawPrice)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      alert('Ingresá un precio válido.')
      return
    }

    startTransition(async () => {
      await updateServicioPrice(barbershopId, service.id, parsedPrice)
      setEditingServiceId(null)
    })
  }

  function handleToggle(serviceId: string, newActive: boolean) {
    startTransition(() => { toggleServicio(barbershopId, serviceId, newActive) })
  }

  function handleDelete(serviceId: string, serviceName: string) {
    if (!confirm(`¿Estás seguro de eliminar el servicio "${serviceName}"?`)) return
    startTransition(async () => {
      const result = await deleteServicio(barbershopId, serviceId)
      if (result && 'error' in result) alert(result.error)
    })
  }

  return (
    <>
      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Nombre</span>
          <span className={styles.thCenter}>Precio</span>
          <span className={styles.thCenter}>Estado</span>
          <span className={styles.thRight}>Acciones</span>
        </div>

        {!services || services.length === 0 ? (
          <div className={styles.empty}>No hay servicios todavía.</div>
        ) : (
          <>
            {services.map(s => {
              const isEditingService = editingServiceId === s.id
              return (
                <div
                  key={s.id}
                  className={`${styles.tableRow} ${styles.desktopRow} ${isEditingService ? styles.tableRowEditing : ''}`}
                >
                  <span className={styles.cellName} data-label="Nombre">
                    {s.name}
                    {s.barbershop_id === null && <span className={styles.tagGlobal}>global</span>}
                  </span>

                  <span className={styles.cellPrice} data-label="Precio">
                    {isEditingService ? (
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

                  <span className={styles.cellStatus} data-label="Estado">
                    <span className={s.active ? styles.badgeActive : styles.badgeInactive}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </span>

                  <div className={styles.cellActions} data-label="Acciones">
                    {isEditingService ? (
                      <>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          disabled={pending}
                          onClick={() => handleSaveService(s)}
                          aria-label={`Guardar precio de ${s.name}`}
                          title="Guardar precio"
                        >
                          {pending ? '…' : <Check size={16} />}
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          disabled={pending}
                          onClick={() => handleCancelEdit(s)}
                          aria-label={`Cancelar edición de ${s.name}`}
                          title="Cancelar edición"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.btnEditInline}
                          disabled={pending}
                          onClick={() => handleStartEdit(s)}
                          aria-label={`Editar precio de ${s.name}`}
                          title="Editar precio"
                        >
                          <Pencil size={16} />
                        </button>
                        <button type="button" className={s.active ? styles.btnToggleOff : styles.btnToggleOn} disabled={pending} onClick={() => handleToggle(s.id, !s.active)}>
                          {s.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" className={styles.btnDelete} disabled={pending} onClick={() => handleDelete(s.id, s.name)}>
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            <div className={styles.mobileAccordionList}>
              {services.map(s => {
                return (
                  <details key={`mobile-${s.id}`} className={styles.mobileAccordionItem}>
                    <summary className={styles.mobileAccordionSummary}>
                      <span className={styles.mobileAccordionName}>
                        {s.name}
                        {s.barbershop_id === null && <span className={styles.tagGlobal}>global</span>}
                      </span>
                      <span className={styles.mobileAccordionSummaryRight}>
                        <span className={styles.priceValue}>
                          {s.default_price != null ? `$${Number(s.default_price).toLocaleString('es-AR')}` : '—'}
                        </span>
                        <span className={s.active ? styles.badgeActive : styles.badgeInactive}>
                          {s.active ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className={styles.mobileChevron} aria-hidden>▾</span>
                      </span>
                    </summary>

                    <div className={styles.mobileAccordionBody}>
                      <div className={styles.mobileInfoRow}>
                        <span className={styles.mobileInfoLabel}>Precio</span>
                        <div className={styles.mobilePriceBox}>
                          {editingServiceId === s.id ? (
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
                        </div>
                      </div>

                      {editingServiceId === s.id ? (
                        <div className={styles.mobileEditActions}>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            disabled={pending}
                            onClick={() => handleSaveService(s)}
                            aria-label={`Guardar precio de ${s.name}`}
                            title="Guardar precio"
                          >
                            {pending ? '…' : <Check size={16} />}
                          </button>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            disabled={pending}
                            onClick={() => handleCancelEdit(s)}
                            aria-label={`Cancelar edición de ${s.name}`}
                            title="Cancelar edición"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.btnEditInline}
                            disabled={pending}
                            onClick={() => handleStartEdit(s)}
                            aria-label={`Editar precio de ${s.name}`}
                            title="Editar precio"
                          >
                            <Pencil size={16} />
                          </button>
                          <button type="button" className={s.active ? styles.btnToggleOff : styles.btnToggleOn} disabled={pending} onClick={() => handleToggle(s.id, !s.active)}>
                            {s.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button type="button" className={`${styles.btnDelete} ${styles.btnDeleteFull}`} disabled={pending} onClick={() => handleDelete(s.id, s.name)}>
                            Eliminar servicio
                          </button>
                        </>
                      )}
                    </div>
                  </details>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
