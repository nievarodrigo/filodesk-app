'use client'

import { useState, useRef, useEffect } from 'react'
import { useActionState } from 'react'
import { venderProducto, type VentaProductoState } from '@/app/actions/producto'
import styles from './widget.module.css'

interface Product { id: string; name: string; sale_price: number; stock: number }
interface Props   { barbershopId: string; products: Product[] }

export default function VenderProductoWidget({ barbershopId, products }: Props) {
  const action = venderProducto.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<VentaProductoState, FormData>(action, undefined)

  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [open, setOpen]         = useState(false)
  const [modal, setModal]       = useState(false)
  const containerRef            = useRef<HTMLDivElement>(null)

  const suggestions = query.trim() === ''
    ? []
    : products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)

  // Cierra el dropdown al clickear afuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function pick(p: Product) {
    setSelected(p)
    setQuery(p.name)
    setOpen(false)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setSelected(null)
    setOpen(true)
  }

  function handleSubmit() {
    // Reset después de enviar exitosamente
    setTimeout(() => {
      setQuery('')
      setSelected(null)
    }, 300)
  }

  return (
    <div className={styles.widget}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p className={styles.widgetTitle} style={{ margin: 0 }}>Venta de producto</p>
        <button
          type="button"
          onClick={() => setModal(true)}
          style={{ background: 'none', border: 'none', fontSize: '.72rem', color: 'var(--muted)', cursor: 'pointer', padding: 0, transition: 'color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          Ver productos →
        </button>
      </div>

      {products.length === 0 && (
        <p style={{ fontSize: '.83rem', color: 'var(--muted)', padding: '8px 0' }}>
          No hay productos con stock disponible.
        </p>
      )}

      {products.length > 0 && (
        <form action={formAction} className={styles.widgetForm} onSubmit={handleSubmit}>
          {state?.message && <p className={styles.widgetError}>{state.message}</p>}

          {/* Autocomplete */}
          <div ref={containerRef} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={query}
              onChange={handleInput}
              onFocus={() => { if (query) setOpen(true) }}
              className={styles.widgetSearch}
              autoComplete="off"
            />
            {/* Input oculto con el ID real */}
            <input type="hidden" name="product_id" value={selected?.id ?? ''} />

            {/* Dropdown de sugerencias */}
            {open && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: '#252525', border: '1px solid #3a3a3a', borderRadius: 8,
                marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.4)',
              }}>
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pick(p)}
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderBottom: '1px solid #2a2a2a', transition: 'background .1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '.88rem', color: 'var(--cream)', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: '.78rem', color: 'var(--muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      ${p.sale_price.toLocaleString('es-AR')} · {p.stock} en stock
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Precio y stock del seleccionado */}
          {selected && (
            <p style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                ${selected.sale_price.toLocaleString('es-AR')}
              </span>
              {' · '}{selected.stock} en stock
            </p>
          )}

          <div className={styles.widgetRow}>
            <input name="quantity" type="number" min="1" max={selected?.stock ?? 999} step="1" defaultValue="1" className={styles.widgetQty} />
            <input name="date" type="hidden" value={new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })} />
            <button type="submit" className={styles.widgetBtn} disabled={pending || !selected}>
              {pending ? '…' : 'Vender'}
            </button>
          </div>
        </form>
      )}
      {/* Modal ver productos */}
      {modal && (
        <div
          onClick={() => setModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 14,
              padding: '24px 28px', width: '100%', maxWidth: 480,
              maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cream)' }}>Productos disponibles</p>
              <button
                onClick={() => setModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#7a7060', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 4 }}
              >✕</button>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {products.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { pick(p); setModal(false) }}
                  style={{
                    background: 'transparent', border: 'none', borderBottom: '1px solid #2a2a2a',
                    padding: '11px 4px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 12, transition: 'background .1s', borderRadius: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '.9rem', color: 'var(--cream)', fontWeight: 500 }}>{p.name}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '.82rem', color: 'var(--green)', fontWeight: 600 }}>
                      ${p.sale_price.toLocaleString('es-AR')}
                    </span>
                    <span style={{ fontSize: '.78rem', color: p.stock <= 2 ? 'var(--red)' : 'var(--muted)' }}>
                      {p.stock} en stock
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
