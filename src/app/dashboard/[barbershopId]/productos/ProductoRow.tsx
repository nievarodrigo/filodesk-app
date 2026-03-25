'use client'

import { useState, useTransition } from 'react'
import { reponerStock, toggleProducto } from '@/app/actions/producto'
import styles from './productos.module.css'

interface Props {
  barbershopId: string
  product: {
    id: string; name: string; cost_price: number
    sale_price: number; stock: number; active: boolean
  }
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function ProductoRow({ barbershopId, product }: Props) {
  const [reponer, setReponer] = useState(false)
  const [qty, setQty]         = useState('1')
  const [cost, setCost]       = useState(String(product.cost_price))
  const [pending, start]      = useTransition()

  const margin = product.cost_price > 0
    ? Math.round((product.sale_price - product.cost_price) / product.cost_price * 100)
    : null

  return (
    <>
      <div className={styles.tableRow}>
        <span style={{ fontWeight: 600 }}>{product.name}</span>
        <span>{formatARS(product.cost_price)}</span>
        <span style={{ color: 'var(--green)' }}>{formatARS(product.sale_price)}</span>
        <span style={{ color: margin !== null ? (margin >= 30 ? 'var(--green)' : 'var(--gold)') : 'var(--muted)' }}>
          {margin !== null ? `${margin}%` : '—'}
        </span>
        <span>
          <span className={product.stock <= 2 ? styles.stockLow : styles.stockOk}>
            {product.stock} u.
          </span>
        </span>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button className={styles.btnReponer} onClick={() => setReponer(r => !r)} disabled={pending}>
            {reponer ? 'Cancelar' : '+ Stock'}
          </button>
          <button
            className={product.active ? styles.btnToggleOff : styles.btnToggleOn}
            disabled={pending}
            onClick={() => start(() => toggleProducto(barbershopId, product.id, !product.active))}
          >
            {product.active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {reponer && (
        <div className={styles.reponerRow}>
          <span className={styles.reponerLabel}>Reponer stock:</span>
          <div className={styles.reponerFields}>
            <div className={styles.miniField}>
              <label className={styles.miniLabel}>Cantidad</label>
              <input type="number" min="1" step="1" className={styles.miniInput} value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className={styles.miniField}>
              <label className={styles.miniLabel}>Costo unitario</label>
              <input type="number" min="0" step="1" className={styles.miniInput} value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <button
              className={styles.btnPrimary}
              disabled={pending}
              onClick={() => start(async () => {
                await reponerStock(barbershopId, product.id, Number(qty), Number(cost))
                setReponer(false)
              })}
            >
              {pending ? '…' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
