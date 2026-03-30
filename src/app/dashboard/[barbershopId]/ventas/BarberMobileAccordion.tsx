'use client'

import { useMemo, useState } from 'react'
import styles from './ventas.module.css'

type SaleItem = {
  id: string
  amount: number
  status: string
  date: string
  created_at?: string
  notes?: string
  service_types?: Array<{ name: string }> | { name: string }
}

type BarberGroup = {
  barberName: string
  count: number
  total: number
  commission: number
  sales: SaleItem[]
}

type Props = {
  groups: BarberGroup[]
  showStatus: boolean
}

const PAGE_SIZE_BARBER_SERVICES = 5

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatShortDate(date: string) {
  const [yyyy, mm, dd] = date.slice(0, 10).split('-')
  if (!yyyy || !mm || !dd) return date
  return `${dd}-${mm}-${yyyy.slice(-2)}`
}

function formatShortTime(dateTime?: string | null) {
  if (!dateTime) return '—'
  const parsed = new Date(dateTime)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function rangeLabel(page: number, total: number) {
  const from = (page - 1) * PAGE_SIZE_BARBER_SERVICES + 1
  const to = Math.min(total, page * PAGE_SIZE_BARBER_SERVICES)
  return `${from}-${to}`
}

export default function BarberMobileAccordion({ groups, showStatus }: Props) {
  const [pagesByBarber, setPagesByBarber] = useState<Record<string, number>>({})

  const totalPagesByBarber = useMemo(() => {
    const map: Record<string, number> = {}
    for (const group of groups) {
      map[group.barberName] = Math.ceil(group.sales.length / PAGE_SIZE_BARBER_SERVICES)
    }
    return map
  }, [groups])

  const goToPage = (barberName: string, nextPage: number) => {
    setPagesByBarber(prev => ({ ...prev, [barberName]: nextPage }))
  }

  return (
    <div className={styles.byBarberMobileAccordion}>
      {groups.map(group => {
        const totalPages = totalPagesByBarber[group.barberName] ?? 1
        const currentPage = Math.min(pagesByBarber[group.barberName] ?? 1, totalPages)
        const start = (currentPage - 1) * PAGE_SIZE_BARBER_SERVICES
        const end = start + PAGE_SIZE_BARBER_SERVICES
        const visibleSales = group.sales.slice(start, end)

        const hasPrev = currentPage > 1
        const hasNext = currentPage < totalPages

        return (
          <details key={group.barberName} className={styles.accordionGroup}>
            <summary className={styles.accordionHeader}>
              <div className={styles.accordionHeaderTop}>
                <span className={styles.accordionBarber}>{group.barberName}</span>
                <span className={styles.accordionMeta}>{group.count} servicios · {formatARS(group.total)}</span>
              </div>
              <p className={styles.accordionCommission}>Comisión: {formatARS(group.commission)}</p>
            </summary>

            <div className={styles.accordionBody}>
              {visibleSales.map(sale => {
                const isPending = sale.status === 'pending'
                return (
                  <div key={`${group.barberName}-${sale.id}`} className={styles.accordionItem}>
                    <p className={styles.accordionLine}>
                      <span className={styles.accordionLabel}>Fecha</span>
                      <span>{formatShortDate(sale.date)}</span>
                    </p>
                    <p className={styles.accordionLine}>
                      <span className={styles.accordionLabel}>Hora</span>
                      <span>{formatShortTime(sale.created_at)}</span>
                    </p>
                    <p className={styles.accordionLine}>
                      <span className={styles.accordionLabel}>Servicio</span>
                      <span>{(Array.isArray(sale.service_types) ? sale.service_types?.[0]?.name : sale.service_types?.name) ?? '—'}</span>
                    </p>
                    <p className={styles.accordionLine}>
                      <span className={styles.accordionLabel}>Monto</span>
                      <span className={styles.amount}>{formatARS(sale.amount)}</span>
                    </p>
                    <p className={styles.accordionLine}>
                      <span className={styles.accordionLabel}>Notas</span>
                      <span className={styles.muted}>{sale.notes ?? '—'}</span>
                    </p>
                    {showStatus && (
                      <p className={styles.accordionLine}>
                        <span className={styles.accordionLabel}>Estado</span>
                        <span className={`${styles.statusBadge} ${isPending ? styles.statusPending : styles.statusApproved}`}>
                          {isPending ? 'Pendiente' : 'Confirmado'}
                        </span>
                      </p>
                    )}
                  </div>
                )
              })}

              {totalPages > 1 && (
                <div className={styles.accordionPager}>
                  <span className={styles.accordionPagerInfo}>
                    Servicios {rangeLabel(currentPage, group.sales.length)} de {group.sales.length}
                  </span>
                  <div className={styles.accordionPagerActions}>
                    {hasPrev && (
                      <button
                        type="button"
                        className={styles.accordionPagerBtn}
                        onClick={() => goToPage(group.barberName, currentPage - 1)}
                      >
                        ← Anterior ({rangeLabel(currentPage - 1, group.sales.length)})
                      </button>
                    )}
                    {hasNext && (
                      <button
                        type="button"
                        className={styles.accordionPagerBtn}
                        onClick={() => goToPage(group.barberName, currentPage + 1)}
                      >
                        Siguiente (servicios {rangeLabel(currentPage + 1, group.sales.length)}) →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}
