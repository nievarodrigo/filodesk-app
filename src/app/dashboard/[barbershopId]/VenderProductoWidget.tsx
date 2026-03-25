'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { venderProducto, type VentaProductoState } from '@/app/actions/producto'
import styles from './widget.module.css'

interface Product { id: string; name: string; sale_price: number; stock: number }
interface Props   { barbershopId: string; products: Product[] }

export default function VenderProductoWidget({ barbershopId, products }: Props) {
  const action = venderProducto.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<VentaProductoState, FormData>(action, undefined)
  const [search, setSearch] = useState('')

  const filtered = search.trim() === ''
    ? products
    : products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.widget}>
      <p className={styles.widgetTitle}>Venta de producto</p>
      {products.length === 0 && (
        <p style={{ fontSize: '.83rem', color: 'var(--muted)', padding: '8px 0' }}>
          No hay productos con stock disponible.
        </p>
      )}
      {products.length > 0 && (
        <form action={formAction} className={styles.widgetForm}>
          {state?.message && <p className={styles.widgetError}>{state.message}</p>}
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.widgetSearch}
          />
          <div className={styles.widgetRow}>
            <select name="product_id" className={styles.widgetSelect} defaultValue="">
              <option value="" disabled>Seleccioná producto</option>
              {filtered.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.sale_price.toLocaleString('es-AR')} ({p.stock} en stock)
                </option>
              ))}
              {filtered.length === 0 && (
                <option disabled>Sin resultados</option>
              )}
            </select>
            <input name="quantity" type="number" min="1" step="1" defaultValue="1" className={styles.widgetQty} />
            <input name="date" type="hidden" value={new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })} />
            <button type="submit" className={styles.widgetBtn} disabled={pending}>
              {pending ? '…' : 'Vender'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
