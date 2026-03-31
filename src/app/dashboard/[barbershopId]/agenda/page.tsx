'use client'

import { useCallback, useEffect, useMemo, useState, useTransition, type MouseEvent } from 'react'
import { useParams } from 'next/navigation'
import {
  createAgendaAppointment,
  deleteAgendaAppointment,
  getAgendaData,
  updateAgendaAppointmentStatus,
} from '@/app/actions/agenda'
import { generateAppointmentWhatsAppLink } from '@/lib/whatsapp'
import type { AgendaAppointmentView, AgendaBarber, AgendaService, AppointmentStatus } from '@/types'
import styles from './agenda.module.css'

type ShiftFilter = 'all' | 'morning' | 'afternoon' | 'night'

type Draft = {
  barberId: string
  dateKey: string
  startMin: number
  serviceId: string
  clientName: string
  clientPhone: string
  notes: string
}

const OPEN_MIN = 9 * 60
const CLOSE_MIN = 21 * 60
const BUFFER_MIN = 5
const GRID_STEP_MIN = 5
const PX_PER_MIN = 1.25
const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function parseDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function formatDayLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatMinuteLabel(min: number) {
  const hh = Math.floor(min / 60)
  const mm = min % 60
  return `${pad2(hh)}:${pad2(mm)}`
}

function toTimeInput(min: number) {
  return formatMinuteLabel(min)
}

function fromTimeInput(v: string) {
  const [h, m] = v.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return OPEN_MIN
  return h * 60 + m
}

function clampToAgenda(min: number) {
  return Math.max(OPEN_MIN, Math.min(CLOSE_MIN, min))
}

function snapToStep(min: number, step = GRID_STEP_MIN) {
  return Math.round(min / step) * step
}

function monthMatrix(baseMonth: Date) {
  const first = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1)
  const last = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 0)
  const startPad = first.getDay()
  const totalCells = Math.ceil((startPad + last.getDate()) / 7) * 7
  const cells: Array<Date | null> = []
  for (let i = 0; i < totalCells; i++) {
    const day = i - startPad + 1
    if (day < 1 || day > last.getDate()) cells.push(null)
    else cells.push(new Date(baseMonth.getFullYear(), baseMonth.getMonth(), day))
  }
  return cells
}

function getFilterWindow(filter: ShiftFilter) {
  if (filter === 'morning') return { from: 9 * 60, to: 13 * 60 }
  if (filter === 'afternoon') return { from: 13 * 60, to: 17 * 60 }
  if (filter === 'night') return { from: 17 * 60, to: 21 * 60 }
  return { from: OPEN_MIN, to: CLOSE_MIN }
}

function getMonthRangeISO(monthRef: Date) {
  const from = new Date(monthRef.getFullYear(), monthRef.getMonth(), 1, 0, 0, 0, 0)
  const to = new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 1, 0, 0, 0, 0)
  return { fromISO: from.toISOString(), toISO: to.toISOString() }
}

function toDateKeyFromISO(iso: string) {
  return toDateKey(new Date(iso))
}

function getMinutesFromISO(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function toISOFromDateKeyAndMin(dateKey: string, min: number) {
  const base = parseDateKey(dateKey)
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(min / 60), min % 60, 0, 0)
  return date.toISOString()
}

function isRangeOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB
}

function statusLabel(status: AppointmentStatus) {
  if (status === 'confirmed') return 'Confirmado'
  if (status === 'completed') return 'Completado'
  if (status === 'cancelled') return 'Cancelado'
  return 'Pendiente'
}

export default function AgendaPage() {
  const params = useParams<{ barbershopId: string }>()
  const barbershopId = typeof params?.barbershopId === 'string' ? params.barbershopId : ''

  const now = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => toDateKey(now), [now])

  const [monthRef, setMonthRef] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [activeMobileBarberId, setActiveMobileBarberId] = useState<string>('')

  const [barbers, setBarbers] = useState<AgendaBarber[]>([])
  const [services, setServices] = useState<AgendaService[]>([])
  const [appointments, setAppointments] = useState<AgendaAppointmentView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [draft, setDraft] = useState<Draft | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<AgendaAppointmentView | null>(null)
  const [pending, startTransition] = useTransition()

  const loadAgenda = useCallback(async () => {
    if (!barbershopId) return

    setLoading(true)
    setError(null)

    const { fromISO, toISO } = getMonthRangeISO(monthRef)
    const result = await getAgendaData(barbershopId, fromISO, toISO)

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    setBarbers(result.barbers)
    setServices(result.services)
    setAppointments(result.appointments)
    setActiveMobileBarberId((prev) => prev || result.barbers[0]?.id || '')
    setLoading(false)
  }, [barbershopId, monthRef])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAgenda()
  }, [loadAgenda])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const sync = () => setIsMobile(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const calendarCells = useMemo(() => monthMatrix(monthRef), [monthRef])

  const selectedKey = selectedDateKey ?? todayKey
  const windowRange = getFilterWindow(shiftFilter)
  const visibleFrom = windowRange.from
  const visibleTo = windowRange.to
  const visibleRangeMin = visibleTo - visibleFrom

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const appt of appointments) {
      const day = toDateKeyFromISO(appt.startTime)
      if (appt.status === 'cancelled') continue
      map[day] = (map[day] ?? 0) + 1
    }
    return map
  }, [appointments])

  const dayAppointments = useMemo(() => {
    return appointments.filter((appt) => toDateKeyFromISO(appt.startTime) === selectedKey)
  }, [appointments, selectedKey])

  const violationIds = useMemo(() => {
    const byBarber: Record<string, AgendaAppointmentView[]> = {}
    for (const appt of dayAppointments) {
      if (appt.status === 'cancelled') continue
      byBarber[appt.barberId] = [...(byBarber[appt.barberId] ?? []), appt]
    }

    const conflicts = new Set<string>()
    for (const list of Object.values(byBarber)) {
      const sorted = [...list].sort((a, b) => getMinutesFromISO(a.startTime) - getMinutesFromISO(b.startTime))
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        const prevEnd = getMinutesFromISO(prev.endTime)
        const currStart = getMinutesFromISO(curr.startTime)
        if (currStart < prevEnd + BUFFER_MIN) {
          conflicts.add(prev.id)
          conflicts.add(curr.id)
        }
      }
    }
    return conflicts
  }, [dayAppointments])

  const visibleBarbers = isMobile
    ? barbers.filter((barber) => barber.id === activeMobileBarberId)
    : barbers

  const serviceOptions = services
  const selectedService = serviceOptions.find((service) => service.id === (draft?.serviceId ?? serviceOptions[0]?.id)) ?? serviceOptions[0]
  const draftEndMin = draft && selectedService
    ? clampToAgenda(draft.startMin + selectedService.durationMin + BUFFER_MIN)
    : null

  const draftConflict = useMemo(() => {
    if (!draft || draftEndMin === null) return false

    const sameBarber = dayAppointments.filter((appt) => appt.barberId === draft.barberId && appt.status !== 'cancelled')
    return sameBarber.some((appt) => {
      const aStart = getMinutesFromISO(appt.startTime)
      const aEnd = getMinutesFromISO(appt.endTime) + BUFFER_MIN
      return isRangeOverlap(draft.startMin, draftEndMin, aStart, aEnd)
    })
  }, [dayAppointments, draft, draftEndMin])

  const canSchedule = Boolean(draft && draft.clientName.trim() && selectedService) && !draftConflict

  function prevMonth() {
    setMonthRef((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function nextMonth() {
    setMonthRef((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  function openDraft(dateKey: string, barberId: string, min: number) {
    if (!serviceOptions.length) return
    const safe = clampToAgenda(snapToStep(min))
    setDraft({
      barberId,
      dateKey,
      startMin: safe,
      serviceId: serviceOptions[0].id,
      clientName: '',
      clientPhone: '',
      notes: '',
    })
  }

  function handleColumnClick(event: MouseEvent<HTMLDivElement>, barberId: string) {
    if (!selectedDateKey) return
    const rect = event.currentTarget.getBoundingClientRect()
    const y = event.clientY - rect.top
    const minFromTop = Math.max(0, y / PX_PER_MIN)
    const targetMin = visibleFrom + minFromTop
    openDraft(selectedDateKey, barberId, targetMin)
  }

  function closeDraft() {
    setDraft(null)
  }

  function saveDraft() {
    if (!draft || !selectedService || draftEndMin === null || draftConflict || !barbershopId) return

    startTransition(async () => {
      const result = await createAgendaAppointment(barbershopId, {
        barberId: draft.barberId,
        clientName: draft.clientName,
        clientPhone: draft.clientPhone,
        serviceId: draft.serviceId,
        startTime: toISOFromDateKeyAndMin(draft.dateKey, draft.startMin),
        endTime: toISOFromDateKeyAndMin(draft.dateKey, draftEndMin),
        notes: draft.notes,
      })

      if ('error' in result) {
        alert(result.error)
        return
      }

      setDraft(null)
      await loadAgenda()
    })
  }

  function handleStatusChange(appointmentId: string, status: AppointmentStatus) {
    if (!barbershopId) return

    startTransition(async () => {
      const result = await updateAgendaAppointmentStatus(barbershopId, appointmentId, status)
      if ('error' in result) {
        alert(result.error)
        return
      }
      setEditingAppointment((prev) => (prev ? { ...prev, status } : prev))
      await loadAgenda()
    })
  }

  function handleDeleteAppointment(appointmentId: string) {
    if (!barbershopId) return
    const confirmed = confirm('¿Querés borrar el turno?')
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteAgendaAppointment(barbershopId, appointmentId)
      if ('error' in result) {
        alert(result.error)
        return
      }
      setEditingAppointment(null)
      await loadAgenda()
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Agenda</h1>
        <p className={styles.subtitle}>Elegí a quién querés agendar y chequeá que el horario esté libre antes de confirmar.</p>
      </header>

      {loading && <p className={styles.infoLine}>Cargando agenda...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !selectedDateKey ? (
        <section className={styles.monthCard}>
          <div className={styles.monthHeader}>
            <button type="button" className={styles.monthNavBtn} onClick={prevMonth} aria-label="Mes anterior">◀</button>
            <p className={styles.monthTitle}>{monthRef.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</p>
            <button type="button" className={styles.monthNavBtn} onClick={nextMonth} aria-label="Mes siguiente">▶</button>
          </div>

          <div className={styles.monthGrid}>
            {WEEK_DAYS.map((w) => (
              <span key={w} className={styles.weekday}>{w}</span>
            ))}
            {calendarCells.map((day, idx) => {
              if (!day) return <span key={`empty-${idx}`} className={styles.dayCellEmpty} />
              const dayKey = toDateKey(day)
              const count = appointmentsByDay[dayKey] ?? 0
              return (
                <button
                  key={dayKey}
                  type="button"
                  className={styles.dayCell}
                  onClick={() => {
                    setSelectedDateKey(dayKey)
                    setShiftFilter('all')
                  }}
                >
                  <span className={styles.dayNumber}>{day.getDate()}</span>
                  {count > 0 && <span className={styles.dayBadge}>{count}</span>}
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      {!loading && selectedDateKey ? (
        <section className={styles.dayCard}>
          <div className={styles.dayHeader}>
            <button type="button" className={styles.backBtn} onClick={() => setSelectedDateKey(null)}>← Volver al mes</button>
            <p className={styles.dayTitle}>{formatDayLabel(selectedDateKey)}</p>
          </div>

          <div className={styles.shiftFilters}>
            <button type="button" className={shiftFilter === 'morning' ? styles.shiftBtnActive : styles.shiftBtn} onClick={() => setShiftFilter('morning')}>🌅 Mañana</button>
            <button type="button" className={shiftFilter === 'afternoon' ? styles.shiftBtnActive : styles.shiftBtn} onClick={() => setShiftFilter('afternoon')}>☀️ Tarde</button>
            <button type="button" className={shiftFilter === 'night' ? styles.shiftBtnActive : styles.shiftBtn} onClick={() => setShiftFilter('night')}>🌙 Noche</button>
            <button type="button" className={shiftFilter === 'all' ? styles.shiftBtnActive : styles.shiftBtn} onClick={() => setShiftFilter('all')}>🌎 Ver todo</button>
          </div>

          {isMobile && (
            <div className={styles.mobileBarberPicker}>
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  type="button"
                  className={barber.id === activeMobileBarberId ? styles.barberPillActive : styles.barberPill}
                  onClick={() => setActiveMobileBarberId(barber.id)}
                >
                  {barber.name}
                </button>
              ))}
            </div>
          )}

          <div className={styles.dayGridWrap}>
            <div className={styles.timeCol}>
              {Array.from({ length: Math.ceil(visibleRangeMin / 30) + 1 }, (_, i) => {
                const min = visibleFrom + i * 30
                if (min > visibleTo) return null
                return (
                  <span key={min} className={styles.timeMark} style={{ top: (min - visibleFrom) * PX_PER_MIN }}>
                    {formatMinuteLabel(min)}
                  </span>
                )
              })}
            </div>

            <div className={styles.barberCols}>
              {visibleBarbers.map((barber) => {
                const barberAppointments = dayAppointments
                  .filter((appt) => appt.barberId === barber.id)
                  .filter((appt) => {
                    const start = getMinutesFromISO(appt.startTime)
                    const end = getMinutesFromISO(appt.endTime)
                    return start < visibleTo && end > visibleFrom
                  })

                return (
                  <div key={barber.id} className={styles.barberColWrap}>
                    <div className={styles.barberColHeader}>{barber.name}</div>
                    <div className={styles.barberCol} onClick={(event) => handleColumnClick(event, barber.id)}>
                      {Array.from({ length: Math.ceil(visibleRangeMin / 30) }, (_, i) => (
                        <span key={`${barber.id}-line-${i}`} className={styles.halfHourLine} style={{ top: i * 30 * PX_PER_MIN }} />
                      ))}

                      {barberAppointments.map((appt) => {
                        const start = Math.max(getMinutesFromISO(appt.startTime), visibleFrom)
                        const end = Math.min(getMinutesFromISO(appt.endTime), visibleTo)
                        const top = (start - visibleFrom) * PX_PER_MIN
                        const height = Math.max((end - start) * PX_PER_MIN, 22)
                        const violated = violationIds.has(appt.id)
                        return (
                          <article
                            key={appt.id}
                            className={`${styles.apptCard} ${violated ? styles.apptCardConflict : ''}`}
                            style={{ top, height }}
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditingAppointment(appt)
                            }}
                            title={violated ? 'Este turno viola el buffer de 5 min' : 'Turno OK'}
                          >
                            <p className={styles.apptTime}>{formatMinuteLabel(getMinutesFromISO(appt.startTime))} - {formatMinuteLabel(getMinutesFromISO(appt.endTime))}</p>
                            <p className={styles.apptService}>{appt.serviceName}</p>
                            <p className={styles.apptClient}>{appt.clientName}</p>
                            <p className={styles.apptStatus}>{statusLabel(appt.status)}</p>
                            {violated && <p className={styles.apptWarn}>Buffer inválido (&lt; 5 min)</p>}
                          </article>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {draft && selectedService && (
        <div className={styles.modalBackdrop} onClick={closeDraft}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h2 className={styles.modalTitle}>Nuevo turno</h2>
            <p className={styles.modalHint}>Agregá el margen de 5 min y chequeá que el horario esté libre.</p>

            <label className={styles.field}>
              <span>Barbero</span>
              <select
                value={draft.barberId}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, barberId: event.target.value } : prev))}
              >
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>{barber.name}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Inicio</span>
              <input
                type="time"
                step={300}
                value={toTimeInput(draft.startMin)}
                onChange={(event) => {
                  const min = snapToStep(fromTimeInput(event.target.value))
                  setDraft((prev) => (prev ? { ...prev, startMin: clampToAgenda(min) } : prev))
                }}
              />
            </label>

            <label className={styles.field}>
              <span>Servicio</span>
              <select
                value={draft.serviceId}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, serviceId: event.target.value } : prev))}
              >
                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>{service.name} ({service.durationMin} min)</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Cliente</span>
              <input
                type="text"
                value={draft.clientName}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, clientName: event.target.value } : prev))}
                placeholder="Nombre del cliente"
              />
            </label>

            <label className={styles.field}>
              <span>Teléfono</span>
              <input
                type="tel"
                value={draft.clientPhone}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, clientPhone: event.target.value } : prev))}
                placeholder="Ej: +54 11 1234 5678"
              />
            </label>

            <label className={styles.field}>
              <span>Notas</span>
              <input
                type="text"
                value={draft.notes}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, notes: event.target.value } : prev))}
                placeholder="Opcional"
              />
            </label>

            <p className={styles.calcLine}>
              Fin estimado (con buffer): <strong>{draftEndMin !== null ? formatMinuteLabel(draftEndMin) : '—'}</strong>
            </p>

            {draftConflict && (
              <p className={styles.error}>Chequeá que el horario esté libre: hay solapamiento con otro turno de ese barbero.</p>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnGhost} onClick={closeDraft} disabled={pending}>Cancelar</button>
              <button type="button" className={styles.btnPrimary} disabled={!canSchedule || pending} onClick={saveDraft}>AGENDAR</button>
            </div>
          </div>
        </div>
      )}

      {editingAppointment && (
        <div className={styles.modalBackdrop} onClick={() => setEditingAppointment(null)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h2 className={styles.modalTitle}>Gestión de turno</h2>
            <p className={styles.modalHint}>
              {editingAppointment.clientName} · {formatDayLabel(toDateKeyFromISO(editingAppointment.startTime))} · {formatMinuteLabel(getMinutesFromISO(editingAppointment.startTime))}
            </p>

            <p className={styles.calcLine}>Estado actual: <strong>{statusLabel(editingAppointment.status)}</strong></p>

            <div className={styles.statusActions}>
              <button type="button" className={styles.btnGhost} disabled={pending} onClick={() => handleStatusChange(editingAppointment.id, 'pending')}>Pendiente</button>
              <button type="button" className={styles.btnPrimary} disabled={pending} onClick={() => handleStatusChange(editingAppointment.id, 'confirmed')}>Confirmar turno</button>
              <button type="button" className={styles.btnGhost} disabled={pending} onClick={() => handleStatusChange(editingAppointment.id, 'completed')}>Completar</button>
            </div>

            <a
              className={styles.btnWhatsApp}
              href={generateAppointmentWhatsAppLink(
                editingAppointment.clientPhone,
                editingAppointment.clientName,
                formatDayLabel(toDateKeyFromISO(editingAppointment.startTime)),
                formatMinuteLabel(getMinutesFromISO(editingAppointment.startTime))
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp de confirmación
            </a>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnDanger}
                disabled={pending}
                onClick={() => handleDeleteAppointment(editingAppointment.id)}
              >
                Borrar turno
              </button>
              <button type="button" className={styles.btnGhost} onClick={() => setEditingAppointment(null)} disabled={pending}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
