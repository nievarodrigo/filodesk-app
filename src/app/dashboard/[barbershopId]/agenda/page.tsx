'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './agenda.module.css'

type ShiftFilter = 'all' | 'morning' | 'afternoon' | 'night'

type Barber = {
  id: string
  name: string
}

type Service = {
  id: string
  name: string
  durationMin: number
}

type Appointment = {
  id: string
  barberId: string
  dateKey: string
  startMin: number
  durationMin: number
  serviceName: string
  clientName: string
}

type Draft = {
  barberId: string
  dateKey: string
  startMin: number
  serviceId: string
  clientName: string
}

const OPEN_MIN = 9 * 60
const CLOSE_MIN = 21 * 60
const BUFFER_MIN = 5
const GRID_STEP_MIN = 5
const PX_PER_MIN = 1.25
const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const MOCK_BARBERS: Barber[] = [
  { id: 'b1', name: 'Juan' },
  { id: 'b2', name: 'Mateo' },
  { id: 'b3', name: 'Luca' },
]

const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Corte clásico', durationMin: 35 },
  { id: 's2', name: 'Fade + barba', durationMin: 50 },
  { id: 's3', name: 'Barba premium', durationMin: 30 },
  { id: 's4', name: 'Color + styling', durationMin: 70 },
]

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
  const d = parseDateKey(dateKey)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
    if (day < 1 || day > last.getDate()) {
      cells.push(null)
    } else {
      cells.push(new Date(baseMonth.getFullYear(), baseMonth.getMonth(), day))
    }
  }
  return cells
}

function getFilterWindow(filter: ShiftFilter) {
  if (filter === 'morning') return { from: 9 * 60, to: 13 * 60 }
  if (filter === 'afternoon') return { from: 13 * 60, to: 17 * 60 }
  if (filter === 'night') return { from: 17 * 60, to: 21 * 60 }
  return { from: OPEN_MIN, to: CLOSE_MIN }
}

function buildMockAppointments(todayKey: string): Appointment[] {
  return [
    { id: 'a1', barberId: 'b1', dateKey: todayKey, startMin: 9 * 60, durationMin: 45, serviceName: 'Corte clásico', clientName: 'Nico' },
    { id: 'a2', barberId: 'b1', dateKey: todayKey, startMin: 9 * 60 + 47, durationMin: 30, serviceName: 'Barba premium', clientName: 'Leo' },
    { id: 'a3', barberId: 'b2', dateKey: todayKey, startMin: 9 * 60, durationMin: 50, serviceName: 'Fade + barba', clientName: 'Santi' },
    { id: 'a4', barberId: 'b3', dateKey: todayKey, startMin: 13 * 60, durationMin: 70, serviceName: 'Color + styling', clientName: 'Tomi' },
    { id: 'a5', barberId: 'b2', dateKey: todayKey, startMin: 17 * 60 + 30, durationMin: 35, serviceName: 'Corte clásico', clientName: 'Fede' },
    { id: 'a6', barberId: 'b1', dateKey: todayKey, startMin: 18 * 60 + 15, durationMin: 50, serviceName: 'Fade + barba', clientName: 'Dami' },
    { id: 'a7', barberId: 'b3', dateKey: toDateKey(new Date(parseDateKey(todayKey).getFullYear(), parseDateKey(todayKey).getMonth(), parseDateKey(todayKey).getDate() + 1)), startMin: 10 * 60, durationMin: 35, serviceName: 'Corte clásico', clientName: 'Agus' },
  ]
}

function isRangeOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB
}

export default function AgendaPage() {
  const now = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => toDateKey(now), [now])

  const [monthRef, setMonthRef] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [activeMobileBarberId, setActiveMobileBarberId] = useState(MOCK_BARBERS[0].id)
  const [appointments, setAppointments] = useState<Appointment[]>(() => buildMockAppointments(todayKey))
  const [draft, setDraft] = useState<Draft | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const sync = () => setIsMobile(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const windowRange = getFilterWindow(shiftFilter)
  const visibleFrom = windowRange.from
  const visibleTo = windowRange.to
  const visibleRangeMin = visibleTo - visibleFrom

  const calendarCells = useMemo(() => monthMatrix(monthRef), [monthRef])
  const selectedKey = selectedDateKey ?? todayKey

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const appt of appointments) {
      map[appt.dateKey] = (map[appt.dateKey] ?? 0) + 1
    }
    return map
  }, [appointments])

  const dayAppointments = useMemo(
    () => appointments.filter((appt) => appt.dateKey === selectedKey),
    [appointments, selectedKey]
  )

  const violationIds = useMemo(() => {
    const byBarber: Record<string, Appointment[]> = {}
    for (const appt of dayAppointments) {
      byBarber[appt.barberId] = [...(byBarber[appt.barberId] ?? []), appt]
    }
    const conflicts = new Set<string>()
    for (const list of Object.values(byBarber)) {
      const sorted = [...list].sort((a, b) => a.startMin - b.startMin)
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        const prevEndWithBuffer = prev.startMin + prev.durationMin + BUFFER_MIN
        if (curr.startMin < prevEndWithBuffer) {
          conflicts.add(prev.id)
          conflicts.add(curr.id)
        }
      }
    }
    return conflicts
  }, [dayAppointments])

  const visibleBarbers = isMobile
    ? MOCK_BARBERS.filter((b) => b.id === activeMobileBarberId)
    : MOCK_BARBERS

  const serviceOptions = MOCK_SERVICES
  const selectedService = serviceOptions.find((s) => s.id === (draft?.serviceId ?? serviceOptions[0].id)) ?? serviceOptions[0]
  const draftEndMin = draft ? clampToAgenda(draft.startMin + selectedService.durationMin + BUFFER_MIN) : null

  const draftConflict = useMemo(() => {
    if (!draft || draftEndMin === null) return false
    const sameBarber = appointments.filter((a) => a.dateKey === draft.dateKey && a.barberId === draft.barberId)
    return sameBarber.some((a) => {
      const aStart = a.startMin
      const aEnd = a.startMin + a.durationMin + BUFFER_MIN
      return isRangeOverlap(draft.startMin, draftEndMin, aStart, aEnd)
    })
  }, [appointments, draft, draftEndMin])

  const canSchedule = Boolean(draft) && !draftConflict

  function prevMonth() {
    setMonthRef((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function nextMonth() {
    setMonthRef((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  function openDraft(dateKey: string, barberId: string, min: number) {
    const safe = clampToAgenda(snapToStep(min))
    setDraft({
      barberId,
      dateKey,
      startMin: safe,
      serviceId: serviceOptions[0].id,
      clientName: '',
    })
  }

  function handleColumnClick(event: React.MouseEvent<HTMLDivElement>, barberId: string) {
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
    if (!draft || draftEndMin === null || draftConflict) return
    const service = serviceOptions.find((s) => s.id === draft.serviceId) ?? serviceOptions[0]
    setAppointments((prev) => [
      {
        id: `new-${Date.now()}`,
        barberId: draft.barberId,
        dateKey: draft.dateKey,
        startMin: draft.startMin,
        durationMin: service.durationMin,
        serviceName: service.name,
        clientName: draft.clientName.trim() || 'Cliente sin nombre',
      },
      ...prev,
    ])
    setDraft(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Agenda</h1>
        <p className={styles.subtitle}>Elegí a quién querés agendar y chequeá que el horario esté libre antes de confirmar.</p>
      </header>

      {!selectedDateKey ? (
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
      ) : (
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
              {MOCK_BARBERS.map((barber) => (
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
                  .filter((a) => a.barberId === barber.id)
                  .filter((a) => {
                    const endWithBuffer = a.startMin + a.durationMin + BUFFER_MIN
                    return a.startMin < visibleTo && endWithBuffer > visibleFrom
                  })

                return (
                  <div key={barber.id} className={styles.barberColWrap}>
                    <div className={styles.barberColHeader}>{barber.name}</div>
                    <div className={styles.barberCol} onClick={(event) => handleColumnClick(event, barber.id)}>
                      {Array.from({ length: Math.ceil(visibleRangeMin / 30) }, (_, i) => (
                        <span key={`${barber.id}-line-${i}`} className={styles.halfHourLine} style={{ top: i * 30 * PX_PER_MIN }} />
                      ))}

                      {barberAppointments.map((appt) => {
                        const start = Math.max(appt.startMin, visibleFrom)
                        const end = Math.min(appt.startMin + appt.durationMin + BUFFER_MIN, visibleTo)
                        const top = (start - visibleFrom) * PX_PER_MIN
                        const height = Math.max((end - start) * PX_PER_MIN, 20)
                        const violated = violationIds.has(appt.id)
                        return (
                          <article
                            key={appt.id}
                            className={`${styles.apptCard} ${violated ? styles.apptCardConflict : ''}`}
                            style={{ top, height }}
                            onClick={(event) => event.stopPropagation()}
                            title={violated ? 'Este turno viola el buffer de 5 min' : 'Turno OK'}
                          >
                            <p className={styles.apptTime}>{formatMinuteLabel(appt.startMin)} - {formatMinuteLabel(appt.startMin + appt.durationMin + BUFFER_MIN)}</p>
                            <p className={styles.apptService}>{appt.serviceName}</p>
                            <p className={styles.apptClient}>{appt.clientName}</p>
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
      )}

      {draft && (
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
                {MOCK_BARBERS.map((barber) => (
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

            <p className={styles.calcLine}>
              Fin estimado (con buffer): <strong>{draftEndMin !== null ? formatMinuteLabel(draftEndMin) : '—'}</strong>
            </p>

            {draftConflict && (
              <p className={styles.error}>Chequeá que el horario esté libre: hay solapamiento con otro turno de ese barbero.</p>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnGhost} onClick={closeDraft}>Cancelar</button>
              <button type="button" className={styles.btnPrimary} disabled={!canSchedule} onClick={saveDraft}>AGENDAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
