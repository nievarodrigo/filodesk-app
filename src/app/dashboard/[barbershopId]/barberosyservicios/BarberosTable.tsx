'use client'

import { useState, useTransition } from 'react'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { deleteBarber, toggleBarberActive, updateBarberCommission, updateBarberData } from '@/app/actions/barber'
import { generateInviteWhatsAppLink } from '@/lib/whatsapp'
import styles from './barberos.module.css'

interface Barber {
  id: string
  name: string
  last_name?: string | null
  email: string | null
  phone: string | null
  commission_pct: number | null
  active: boolean
}

interface Props {
  barbershopId: string
  barbershopName: string
  barbers: Barber[]
}

export default function BarberosTable({ barbershopId, barbershopName, barbers }: Props) {
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null)
  const [profileDrafts, setProfileDrafts] = useState<Record<string, {
    name: string
    lastName: string
    email: string
    phone: string
  }>>(
    Object.fromEntries(barbers.map(b => [
      b.id,
      {
        name: b.name,
        lastName: b.last_name ?? '',
        email: b.email ?? '',
        phone: b.phone ?? '',
      },
    ]))
  )
  const [commissions, setCommissions] = useState<Record<string, string>>(
    Object.fromEntries(barbers.map(b => [b.id, String(b.commission_pct ?? '')]))
  )
  const [pending, startTransition] = useTransition()

  function handleCommissionChange(id: string, value: string) {
    setCommissions(prev => ({ ...prev, [id]: value }))
  }

  function handleProfileChange(id: string, field: 'name' | 'lastName' | 'email' | 'phone', value: string) {
    setProfileDrafts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  function handleStartEdit(barber: Barber) {
    setProfileDrafts(prev => ({
      ...prev,
      [barber.id]: {
        name: barber.name,
        lastName: barber.last_name ?? '',
        email: barber.email ?? '',
        phone: barber.phone ?? '',
      },
    }))
    setCommissions(prev => ({ ...prev, [barber.id]: String(barber.commission_pct ?? '') }))
    setEditingBarberId(barber.id)
  }

  function handleCancelEdit(barber: Barber) {
    setProfileDrafts(prev => ({
      ...prev,
      [barber.id]: {
        name: barber.name,
        lastName: barber.last_name ?? '',
        email: barber.email ?? '',
        phone: barber.phone ?? '',
      },
    }))
    setCommissions(prev => ({ ...prev, [barber.id]: String(barber.commission_pct ?? '') }))
    setEditingBarberId(null)
  }

  function handleSaveBarber(barber: Barber) {
    const draft = profileDrafts[barber.id]
    const rawCommission = commissions[barber.id]
    const parsedCommission = Number(rawCommission)
    if (!Number.isFinite(parsedCommission) || parsedCommission < 0 || parsedCommission > 100) {
      alert('La comisión debe ser un número entre 0 y 100.')
      return
    }

    startTransition(async () => {
      const profileResult = await updateBarberData(barbershopId, barber.id, {
        name: draft?.name ?? '',
        lastName: draft?.lastName ?? '',
        email: draft?.email ?? '',
        phone: draft?.phone ?? '',
      })
      if (profileResult && 'error' in profileResult) {
        alert(profileResult.error)
        return
      }

      const result = await updateBarberCommission(barbershopId, barber.id, parsedCommission)
      if (result && 'error' in result) {
        alert(result.error)
        return
      }
      setEditingBarberId(null)
    })
  }

  function handleToggle(barberId: string, newActive: boolean) {
    startTransition(() => { toggleBarberActive(barbershopId, barberId, newActive) })
  }

  function handleDeleteBarber(barber: Barber) {
    const fullName = `${barber.name} ${barber.last_name ?? ''}`.trim()
    const confirmed = confirm(`¿Eliminar a "${fullName}"?`)
    if (!confirmed) return

    const confirmedTwice = confirm('Confirmación final: esta acción puede ser irreversible si no tiene ventas asociadas.')
    if (!confirmedTwice) return

    startTransition(async () => {
      const result = await deleteBarber(barbershopId, barber.id)
      if (result && 'error' in result) {
        alert(result.error)
        return
      }
    })
  }

  return (
    <>
      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Ficha</span>
          <span className={styles.thCenter}>Comisión</span>
          <span className={styles.thCenter}>Estado</span>
          <span className={styles.thRight}>Acciones</span>
        </div>

        {!barbers || barbers.length === 0 ? (
          <div className={styles.empty}>Todavía no hay barberos. Agregá el primero arriba.</div>
        ) : (
          <>
            {barbers.map(barber => {
              const isEditingBarber = editingBarberId === barber.id
              const fullName = `${barber.name} ${barber.last_name ?? ''}`.trim()
              return (
                <div key={barber.id} className={`${styles.tableRow} ${styles.desktopRow}`}>
                  <div className={styles.cellIdentity} data-label="Ficha">
                    {isEditingBarber ? (
                      <div className={styles.identityEditGrid}>
                        <input
                          type="text"
                          className={styles.identityInput}
                          value={profileDrafts[barber.id]?.name ?? ''}
                          onChange={e => handleProfileChange(barber.id, 'name', e.target.value)}
                          placeholder="Nombre"
                          aria-label={`Nombre de ${fullName}`}
                          disabled={pending}
                        />
                        <input
                          type="text"
                          className={styles.identityInput}
                          value={profileDrafts[barber.id]?.lastName ?? ''}
                          onChange={e => handleProfileChange(barber.id, 'lastName', e.target.value)}
                          placeholder="Apellido"
                          aria-label={`Apellido de ${fullName}`}
                          disabled={pending}
                        />
                        <input
                          type="email"
                          className={styles.identityInput}
                          value={profileDrafts[barber.id]?.email ?? ''}
                          onChange={e => handleProfileChange(barber.id, 'email', e.target.value)}
                          placeholder="Email"
                          aria-label={`Email de ${fullName}`}
                          disabled={pending}
                        />
                        <input
                          type="tel"
                          className={styles.identityInput}
                          value={profileDrafts[barber.id]?.phone ?? ''}
                          onChange={e => handleProfileChange(barber.id, 'phone', e.target.value)}
                          placeholder="Teléfono"
                          aria-label={`Teléfono de ${fullName}`}
                          disabled={pending}
                        />
                      </div>
                    ) : (
                      <>
                        <span className={styles.cellName}>{fullName}</span>
                        <span className={styles.cellMeta}>{barber.email}</span>
                        <span className={styles.cellMeta}>{barber.phone}</span>
                      </>
                    )}
                  </div>

                  <span className={styles.cellCommission} data-label="Comisión">
                    {isEditingBarber ? (
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

                  <span className={styles.cellStatus} data-label="Estado">
                    <span className={barber.active ? styles.badgeActive : styles.badgeInactive}>
                      {barber.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </span>

                  <div className={styles.cellActions} data-label="Acciones">
                    {isEditingBarber ? (
                      <>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          disabled={pending}
                          onClick={() => handleSaveBarber(barber)}
                          aria-label={`Guardar comisión de ${fullName}`}
                          title="Guardar comisión"
                        >
                          {pending ? '…' : <Check size={16} />}
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          disabled={pending}
                          onClick={() => handleCancelEdit(barber)}
                          aria-label={`Cancelar edición de comisión de ${fullName}`}
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
                          onClick={() => handleStartEdit(barber)}
                          aria-label={`Editar comisión de ${fullName}`}
                          title="Editar comisión"
                        >
                          <Pencil size={16} />
                        </button>
                        {barber.phone && (
                          <a
                            href={generateInviteWhatsAppLink(barber.phone, barbershopName)}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnInvite}
                            aria-label={`Invitar a ${barber.name} por WhatsApp`}
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          className={barber.active ? styles.btnToggleOff : styles.btnToggleOn}
                          disabled={pending}
                          onClick={() => handleToggle(barber.id, !barber.active)}
                        >
                          {barber.active ? 'Dar de baja' : 'Reactivar'}
                        </button>
                        <button
                          type="button"
                          className={styles.btnDelete}
                          disabled={pending}
                          onClick={() => handleDeleteBarber(barber)}
                          aria-label={`Eliminar ${fullName}`}
                          title="Eliminar barbero"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            <div className={styles.mobileAccordionList}>
              {barbers.map(barber => {
                const fullName = `${barber.name} ${barber.last_name ?? ''}`.trim()
                const isEditingBarber = editingBarberId === barber.id
                return (
                  <details key={`mobile-${barber.id}`} className={styles.mobileAccordionItem}>
                    <summary className={styles.mobileAccordionSummary}>
                      <span className={styles.mobileAccordionName}>{fullName}</span>
                      <span className={styles.mobileAccordionSummaryRight}>
                        <span className={barber.active ? styles.badgeActive : styles.badgeInactive}>
                          {barber.active ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className={styles.mobileChevron} aria-hidden>▾</span>
                      </span>
                    </summary>

                    <div className={styles.mobileAccordionBody}>
                      <p className={styles.mobileInfoRow}>
                        <span className={styles.mobileInfoLabel}>Email</span>
                        {isEditingBarber ? (
                          <input
                            type="email"
                            className={styles.identityInput}
                            value={profileDrafts[barber.id]?.email ?? ''}
                            onChange={e => handleProfileChange(barber.id, 'email', e.target.value)}
                            placeholder="Email"
                            aria-label={`Email de ${fullName}`}
                            disabled={pending}
                          />
                        ) : (
                          <span className={styles.mobileInfoValue}>{barber.email || '—'}</span>
                        )}
                      </p>

                      <div className={styles.mobileInfoRow}>
                        <span className={styles.mobileInfoLabel}>Nombre</span>
                        {isEditingBarber ? (
                          <input
                            type="text"
                            className={styles.identityInput}
                            value={profileDrafts[barber.id]?.name ?? ''}
                            onChange={e => handleProfileChange(barber.id, 'name', e.target.value)}
                            placeholder="Nombre"
                            aria-label={`Nombre de ${fullName}`}
                            disabled={pending}
                          />
                        ) : (
                          <span className={styles.mobileInfoValue}>{barber.name}</span>
                        )}
                      </div>

                      <div className={styles.mobileInfoRow}>
                        <span className={styles.mobileInfoLabel}>Apellido</span>
                        {isEditingBarber ? (
                          <input
                            type="text"
                            className={styles.identityInput}
                            value={profileDrafts[barber.id]?.lastName ?? ''}
                            onChange={e => handleProfileChange(barber.id, 'lastName', e.target.value)}
                            placeholder="Apellido"
                            aria-label={`Apellido de ${fullName}`}
                            disabled={pending}
                          />
                        ) : (
                          <span className={styles.mobileInfoValue}>{barber.last_name || '—'}</span>
                        )}
                      </div>

                      <div className={styles.mobileInfoRow}>
                        <span className={styles.mobileInfoLabel}>Teléfono</span>
                        <div className={styles.mobilePhoneRow}>
                          {isEditingBarber ? (
                            <input
                              type="tel"
                              className={styles.identityInput}
                              value={profileDrafts[barber.id]?.phone ?? ''}
                              onChange={e => handleProfileChange(barber.id, 'phone', e.target.value)}
                              placeholder="Teléfono"
                              aria-label={`Teléfono de ${fullName}`}
                              disabled={pending}
                            />
                          ) : (
                            <span className={styles.mobileInfoValue}>{barber.phone || '—'}</span>
                          )}
                          {!isEditingBarber && barber.phone && (
                            <a
                              href={generateInviteWhatsAppLink(barber.phone, barbershopName)}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.btnInvite}
                              aria-label={`Invitar a ${fullName} por WhatsApp`}
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      <div className={styles.mobileInfoRow}>
                        <span className={styles.mobileInfoLabel}>Comisión</span>
                        <div className={styles.mobileCommissionBox}>
                          {isEditingBarber ? (
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
                        </div>
                      </div>

                      {isEditingBarber ? (
                        <div className={styles.mobileEditActions}>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            disabled={pending}
                            onClick={() => handleSaveBarber(barber)}
                            aria-label={`Guardar comisión de ${fullName}`}
                            title="Guardar comisión"
                          >
                            {pending ? '…' : <Check size={16} />}
                          </button>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            disabled={pending}
                            onClick={() => handleCancelEdit(barber)}
                            aria-label={`Cancelar edición de comisión de ${fullName}`}
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
                            onClick={() => handleStartEdit(barber)}
                            aria-label={`Editar comisión de ${fullName}`}
                            title="Editar comisión"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className={barber.active ? styles.btnToggleOff : styles.btnToggleOn}
                            disabled={pending}
                            onClick={() => handleToggle(barber.id, !barber.active)}
                          >
                            {barber.active ? 'Dar de baja' : 'Reactivar'}
                          </button>
                          <button
                            type="button"
                            className={styles.btnDelete}
                            disabled={pending}
                            onClick={() => handleDeleteBarber(barber)}
                            aria-label={`Eliminar ${fullName}`}
                            title="Eliminar barbero"
                          >
                            <Trash2 size={16} />
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
