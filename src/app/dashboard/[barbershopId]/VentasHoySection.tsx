'use client'

import { useState, useTransition } from 'react'
import { deleteVenta } from '@/app/actions/venta'
import styles from './ventashoy.module.css'

interface ServiceSale {
  id: string; type: 'servicio'
  barber: string; service: string
  amount: number; notes: string | null
}
interface ProductSale {
  id: string; type: 'producto'
  product: string; quantity: number
  amount: number
}
type AnyRow = ServiceSale | ProductSale

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

interface Props {
  barbershopId: string
  serviceSales: ServiceSale[]
  productSales: ProductSale[]
}

function DeleteBtn({ barbershopId, saleId }: { barbershopId: string; saleId: string }) {
  const [pending, start] = useTransition()
  return (
    <button className={styles.btnDelete} disabled={pending}
      onClick={() => { if (confirm('¿Eliminar?')) start(() => deleteVenta(barbershopId, saleId)) }}>
      {pending ? '…' : '✕'}
    </button>
  )
}

export default function VentasHoySection({ barbershopId, serviceSales, productSales }: Props) {
  const [filter, setFilter] = useState<'todos' | 'servicio' | 'producto'>('todos')

  const all: AnyRow[] = [...serviceSales, ...productSales]
  const visible = filter === 'todos' ? all : all.filter(r => r.type === filter)

  const totalServicios = serviceSales.reduce((s, r) => s + r.amount, 0)
  const totalProductos = productSales.reduce((s, r) => s + r.amount, 0)
  const total = totalServicios + totalProductos

  const TABS = [
    { key: 'todos',    label: `Todos (${all.length})` },
    { key: 'servicio', label: `Servicios (${serviceSales.length})` },
    { key: 'producto', label: `Productos (${productSales.length})` },
  ] as const

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>
            Ventas de hoy
            {all.length > 0 && <span className={styles.badge}>{all.length}</span>}
          </h2>
          {total > 0 && (
            <div className={styles.totals}>
              <span style={{ color: 'var(--green)' }}>{formatARS(total)}</span>
              {filter === 'todos' && totalProductos > 0 && (
                <span className={styles.totalBreak}>
                  ({formatARS(totalServicios)} servicios + {formatARS(totalProductos)} productos)
                </span>
              )}
            </div>
          )}
        </div>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.key}
              className={filter === t.key ? styles.tabActive : styles.tab}
              onClick={() => setFilter(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>
          {all.length === 0 ? 'Todavía no hay ventas hoy.' : `No hay ${filter === 'servicio' ? 'servicios' : 'productos'} hoy.`}
        </p>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Tipo</span>
            <span>Detalle</span>
            <span>Monto</span>
            <span>Info</span>
            <span></span>
          </div>
          {visible.map(row => (
            <div key={row.id} className={styles.tableRow}>
              <span>
                <span className={row.type === 'servicio' ? styles.badgeServicio : styles.badgeProducto}>
                  {row.type === 'servicio' ? 'Servicio' : 'Producto'}
                </span>
              </span>
              <span style={{ fontWeight: 500 }}>
                {row.type === 'servicio' ? `${row.service}` : `${row.product}`}
              </span>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatARS(row.amount)}</span>
              <span className={styles.muted}>
                {row.type === 'servicio'
                  ? `${row.barber}${row.notes ? ` · ${row.notes}` : ''}`
                  : `${row.quantity} u.`}
              </span>
              {row.type === 'servicio'
                ? <DeleteBtn barbershopId={barbershopId} saleId={row.id} />
                : <span />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
