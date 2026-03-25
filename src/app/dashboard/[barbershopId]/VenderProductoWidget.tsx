'use client'

import { useState, useRef, useEffect } from 'react'
import { useActionState } from 'react'
import { venderProductos, type VentaMultipleState } from '@/app/actions/producto'
import styles from './widget.module.css'

interface Product { id: string; name: string; sale_price: number; stock: number }
interface CartItem { product: Product; quantity: number }
interface Props { barbershopId: string; products: Product[] }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function VenderProductoWidget({ barbershopId, products }: Props) {
  const action = venderProductos.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<VentaMultipleState, FormData>(action, undefined)

  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [qty, setQty]           = useState(1)
  const [open, setOpen]         = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [modal, setModal]       = useState(false)
  const [cart, setCart]         = useState<CartItem[]>([])
  const containerRef            = useRef<HTMLDivElement>(null)
  const formRef                 = useRef<HTMLFormElement>(null)

  const suggestions = query.trim() === ''
    ? []
    : products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)

  // Stock disponible = stock real - lo ya en el carrito
  function availableStock(p: Product) {
    const inCart = cart.find(c => c.product.id === p.id)?.quantity ?? 0
    return p.stock - inCart
  }

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
    setQty(1)
    setOpen(false)
    setActiveIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0]
      if (target && availableStock(target) > 0) pick(target)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  function addToCart() {
    if (!selected || qty < 1) return
    if (availableStock(selected) < qty) return

    setCart(prev => {
      const existing = prev.find(c => c.product.id === selected.id)
      if (existing) {
        return prev.map(c => c.product.id === selected.id
          ? { ...c, quantity: c.quantity + qty }
          : c
        )
      }
      return [...prev, { product: selected, quantity: qty }]
    })
    setQuery('')
    setSelected(null)
    setQty(1)
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(c => c.product.id !== productId))
  }

  const total = cart.reduce((s, c) => s + c.product.sale_price * c.quantity, 0)
  const date  = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  // Reset carrito al confirmar exitosamente
  useEffect(() => {
    if (!pending && !state?.message && formRef.current) {
      setCart([])
    }
  }, [pending, state])

  return (
    <div className={styles.widget}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p className={styles.widgetTitle} style={{ margin: 0 }}>Venta de productos</p>
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

      {products.length === 0 ? (
        <p style={{ fontSize: '.83rem', color: 'var(--muted)', padding: '8px 0' }}>
          No hay productos con stock disponible.
        </p>
      ) : (
        <>
          {/* Autocomplete */}
          <div ref={containerRef} style={{ position: 'relative', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null); setOpen(true); setActiveIdx(-1) }}
                onFocus={() => { if (query) setOpen(true) }}
                onKeyDown={handleKeyDown}
                className={styles.widgetSearch}
                autoComplete="off"
              />
              <input
                type="number"
                min="1"
                max={selected ? availableStock(selected) : 999}
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                className={styles.widgetQty}
              />
              <button
                type="button"
                onClick={addToCart}
                disabled={!selected || availableStock(selected) < qty}
                className={styles.widgetBtnSecondary}
              >
                + Agregar
              </button>
            </div>

            {open && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: '#252525', border: '1px solid #3a3a3a', borderRadius: 8,
                marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.4)',
              }}>
                {suggestions.map((p, i) => {
                  const avail = availableStock(p)
                  const highlighted = i === activeIdx
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pick(p)}
                      disabled={avail <= 0}
                      style={{
                        width: '100%', border: 'none',
                        background: highlighted ? '#2a2a2a' : 'transparent',
                        padding: '10px 14px', cursor: avail <= 0 ? 'not-allowed' : 'pointer',
                        textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', borderBottom: '1px solid #2a2a2a',
                        opacity: avail <= 0 ? 0.4 : 1,
                      }}
                      onMouseEnter={e => { if (avail > 0) { e.currentTarget.style.background = '#2a2a2a'; setActiveIdx(i) } }}
                      onMouseLeave={e => { if (!highlighted) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: '.88rem', color: 'var(--cream)', fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                        {formatARS(p.sale_price)} · {avail} en stock
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Carrito */}
          {cart.length > 0 && (
            <div style={{ background: '#252525', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cart.map(c => (
                <div key={c.product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: '.85rem', color: 'var(--text)', flex: 1 }}>
                    {c.product.name} <span style={{ color: 'var(--muted)' }}>×{c.quantity}</span>
                  </span>
                  <span style={{ fontSize: '.85rem', color: 'var(--green)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {formatARS(c.product.sale_price * c.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(c.product.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '.9rem', padding: '0 2px', lineHeight: 1 }}
                  >✕</button>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #3a3a3a', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Total</span>
                <span style={{ fontSize: '1rem', color: 'var(--gold)', fontWeight: 700 }}>{formatARS(total)}</span>
              </div>
            </div>
          )}

          {/* Formulario de envío */}
          <form ref={formRef} action={formAction}>
            <input type="hidden" name="items" value={JSON.stringify(cart.map(c => ({ product_id: c.product.id, quantity: c.quantity, sale_price: c.product.sale_price })))} />
            <input type="hidden" name="date" value={date} />
            {state?.message && <p className={styles.widgetError} style={{ marginBottom: 6 }}>{state.message}</p>}
            <button type="submit" className={styles.widgetBtn} disabled={pending || cart.length === 0} style={{ width: '100%' }}>
              {pending ? '…' : `Confirmar venta${cart.length > 1 ? ` (${cart.length} productos)` : ''}`}
            </button>
          </form>
        </>
      )}

      {/* Modal ver productos */}
      {modal && (
        <div
          onClick={() => setModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 14, padding: '24px 28px', width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cream)' }}>Productos disponibles</p>
              <button onClick={() => setModal(false)} style={{ background: 'transparent', border: 'none', color: '#7a7060', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {products.map(p => {
                const avail = availableStock(p)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { pick(p); setModal(false) }}
                    disabled={avail <= 0}
                    style={{
                      background: 'transparent', border: 'none', borderBottom: '1px solid #2a2a2a',
                      padding: '11px 4px', cursor: avail <= 0 ? 'not-allowed' : 'pointer', textAlign: 'left',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 12, borderRadius: 4, opacity: avail <= 0 ? 0.4 : 1,
                    }}
                    onMouseEnter={e => { if (avail > 0) e.currentTarget.style.background = '#2a2a2a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: '.9rem', color: 'var(--cream)', fontWeight: 500 }}>{p.name}</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '.82rem', color: 'var(--green)', fontWeight: 600 }}>{formatARS(p.sale_price)}</span>
                      <span style={{ fontSize: '.78rem', color: avail <= 2 ? 'var(--red)' : 'var(--muted)' }}>{avail} en stock</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
