'use client'

import { useState, useTransition } from 'react'
import { Check, Package, Pencil, Trash2, X } from 'lucide-react'
import { deleteProducto, reponerStock, updateProductoData } from '@/app/actions/producto'
import styles from './productos.module.css'

interface Props {
  barbershopId: string
  product: {
    id: string
    name: string
    cost_price: number
    sale_price: number
    stock: number
    active: boolean
  }
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function stockTone(stock: number) {
  if (stock < 5) return styles.stockLow
  if (stock < 10) return styles.stockMid
  return styles.stockOk
}

export default function ProductoRow({ barbershopId, product }: Props) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productDrafts, setProductDrafts] = useState<Record<string, { name: string; sale_price: string; stock: string }>>({
    [product.id]: {
      name: product.name,
      sale_price: String(product.sale_price),
      stock: String(product.stock),
    },
  })
  const [reponer, setReponer] = useState(false)
  const [reponerQty, setReponerQty] = useState('1')
  const [reponerCost, setReponerCost] = useState(String(product.cost_price))
  const [pending, start] = useTransition()

  const isEditingProduct = editingProductId === product.id
  const draft = productDrafts[product.id] ?? {
    name: product.name,
    sale_price: String(product.sale_price),
    stock: String(product.stock),
  }

  const effectiveSalePrice = Number(draft.sale_price)
  const margin = product.cost_price > 0 && Number.isFinite(effectiveSalePrice)
    ? Math.round((effectiveSalePrice - product.cost_price) / product.cost_price * 100)
    : null

  function setDraft(field: 'name' | 'sale_price' | 'stock', value: string) {
    setProductDrafts(prev => ({
      ...prev,
      [product.id]: {
        ...draft,
        [field]: value,
      },
    }))
  }

  function startEdit() {
    setProductDrafts(prev => ({
      ...prev,
      [product.id]: {
        name: product.name,
        sale_price: String(product.sale_price),
        stock: String(product.stock),
      },
    }))
    setEditingProductId(product.id)
  }

  function cancelEdit() {
    setProductDrafts(prev => ({
      ...prev,
      [product.id]: {
        name: product.name,
        sale_price: String(product.sale_price),
        stock: String(product.stock),
      },
    }))
    setEditingProductId(null)
  }

  function handleSaveEdit() {
    const parsedSale = Number(draft.sale_price)
    const parsedStock = Number(draft.stock)
    if (!Number.isFinite(parsedSale) || parsedSale < 0) {
      alert('Ingresá un precio válido.')
      return
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      alert('Ingresá un stock válido.')
      return
    }

    start(async () => {
      const result = await updateProductoData(barbershopId, product.id, {
        name: draft.name,
        sale_price: parsedSale,
        stock: Math.floor(parsedStock),
      })
      if (result && 'error' in result) {
        alert(result.error)
        return
      }
      setEditingProductId(null)
    })
  }

  function handleDeleteProduct() {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return
    start(() => {
      deleteProducto(barbershopId, product.id).then(result => {
        if (result && 'error' in result) {
          alert(result.error)
          return
        }
        if (result?.mode === 'soft') {
          alert('Producto dado de baja (historial conservado).')
        }
      })
    })
  }

  return (
    <>
      <div className={`${styles.tableRow} ${styles.desktopRow}`}>
        <span className={styles.productName}>
          {isEditingProduct ? (
            <input
              type="text"
              className={styles.input}
              value={draft.name}
              onChange={e => setDraft('name', e.target.value)}
              disabled={pending}
              aria-label={`Nombre de ${product.name}`}
            />
          ) : (
            product.name
          )}
        </span>

        <span>{formatARS(product.cost_price)}</span>

        <span className={styles.priceValue}>
          {isEditingProduct ? (
            <input
              type="number"
              min="0"
              step="1"
              className={styles.miniInput}
              value={draft.sale_price}
              onChange={e => setDraft('sale_price', e.target.value)}
              disabled={pending}
              aria-label={`Precio de venta de ${product.name}`}
            />
          ) : (
            formatARS(product.sale_price)
          )}
        </span>

        <span className={styles.marginValue}>
          {margin !== null ? `${margin}%` : '—'}
        </span>

        <span>
          {isEditingProduct ? (
            <input
              type="number"
              min="0"
              step="1"
              className={styles.miniInput}
              value={draft.stock}
              onChange={e => setDraft('stock', e.target.value)}
              disabled={pending}
              aria-label={`Stock de ${product.name}`}
            />
          ) : (
            <span className={stockTone(product.stock)}>
              {product.stock} u.
            </span>
          )}
        </span>

        <div className={styles.actionGroup}>
          {isEditingProduct ? (
            <>
              <button type="button" className={styles.iconBtnPrimary} onClick={handleSaveEdit} disabled={pending} aria-label={`Guardar edición de ${product.name}`} title="Guardar">
                {pending ? '…' : <Check size={16} />}
              </button>
              <button type="button" className={styles.iconBtn} onClick={cancelEdit} disabled={pending} aria-label={`Cancelar edición de ${product.name}`} title="Cancelar">
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.iconBtn} onClick={startEdit} disabled={pending} aria-label={`Editar ${product.name}`} title="Editar">
                <Pencil size={16} />
              </button>
              <button type="button" className={styles.iconBtn} onClick={() => setReponer(r => !r)} disabled={pending} aria-label={`Reponer stock de ${product.name}`} title="Reponer stock">
                <Package size={16} />
              </button>
              <button
                type="button"
                className={styles.iconBtnDanger}
                onClick={handleDeleteProduct}
                disabled={pending}
                aria-label={`Eliminar ${product.name}`}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {reponer && (
        <div className={`${styles.reponerRow} ${styles.desktopRow}`}>
          <span className={styles.reponerLabel}>Reponer stock:</span>
          <div className={styles.reponerFields}>
            <div className={styles.miniField}>
              <label className={styles.miniLabel}>Cantidad</label>
              <input type="number" min="1" step="1" className={styles.miniInput} value={reponerQty} onChange={e => setReponerQty(e.target.value)} />
            </div>
            <div className={styles.miniField}>
              <label className={styles.miniLabel}>Costo unitario</label>
              <input type="number" min="0" step="1" className={styles.miniInput} value={reponerCost} onChange={e => setReponerCost(e.target.value)} />
            </div>
            <button
              className={styles.btnPrimary}
              disabled={pending}
              onClick={() => start(async () => {
                await reponerStock(barbershopId, product.id, Number(reponerQty), Number(reponerCost))
                setReponer(false)
              })}
            >
              {pending ? '…' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      <details className={styles.mobileAccordionItem}>
        <summary className={styles.mobileAccordionSummary}>
          <span className={styles.mobileAccordionName}>{product.name}</span>
          <span className={styles.mobileAccordionSummaryRight}>
            <span className={styles.priceValue}>{formatARS(product.sale_price)}</span>
            <span className={stockTone(product.stock)}>{product.stock} u.</span>
            <span className={styles.mobileChevron} aria-hidden>▾</span>
          </span>
        </summary>

        <div className={styles.mobileAccordionBody}>
          <p className={styles.mobileInfoRow}>
            <span className={styles.mobileInfoLabel}>Costo</span>
            <span className={styles.mobileInfoValue}>{formatARS(product.cost_price)}</span>
          </p>

          <p className={styles.mobileInfoRow}>
            <span className={styles.mobileInfoLabel}>Margen</span>
            <span className={styles.mobileInfoValue}>{margin !== null ? `${margin}%` : '—'}</span>
          </p>

          <p className={styles.mobileInfoRow}>
            <span className={styles.mobileInfoLabel}>Estado</span>
            <span className={product.active ? styles.badgeActive : styles.badgeInactive}>
              {product.active ? 'Activo' : 'Inactivo'}
            </span>
          </p>

          {isEditingProduct ? (
            <div className={styles.mobileEditGrid}>
              <input type="text" className={styles.input} value={draft.name} onChange={e => setDraft('name', e.target.value)} disabled={pending} aria-label={`Nombre de ${product.name}`} />
              <input type="number" min="0" step="1" className={styles.input} value={draft.sale_price} onChange={e => setDraft('sale_price', e.target.value)} disabled={pending} aria-label={`Precio de venta de ${product.name}`} />
              <input type="number" min="0" step="1" className={styles.input} value={draft.stock} onChange={e => setDraft('stock', e.target.value)} disabled={pending} aria-label={`Stock de ${product.name}`} />
              <button type="button" className={styles.iconBtnPrimary} onClick={handleSaveEdit} disabled={pending} aria-label={`Guardar edición de ${product.name}`}>
                {pending ? '…' : <Check size={16} />}
              </button>
              <button type="button" className={styles.iconBtn} onClick={cancelEdit} disabled={pending} aria-label={`Cancelar edición de ${product.name}`}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className={styles.mobileActionRow}>
                <button type="button" className={styles.iconBtn} onClick={startEdit} disabled={pending} aria-label={`Editar ${product.name}`}>
                  <Pencil size={16} />
                </button>
                <button type="button" className={styles.iconBtn} onClick={() => setReponer(r => !r)} disabled={pending} aria-label={`Reponer stock de ${product.name}`}>
                  <Package size={16} />
                </button>
                <button type="button" className={styles.iconBtnDanger} onClick={handleDeleteProduct} disabled={pending} aria-label={`Eliminar ${product.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
              {reponer && (
                <div className={styles.reponerCard}>
                  <div className={styles.reponerFields}>
                    <div className={styles.miniField}>
                      <label className={styles.miniLabel}>Cantidad</label>
                      <input type="number" min="1" step="1" className={styles.miniInput} value={reponerQty} onChange={e => setReponerQty(e.target.value)} />
                    </div>
                    <div className={styles.miniField}>
                      <label className={styles.miniLabel}>Costo unitario</label>
                      <input type="number" min="0" step="1" className={styles.miniInput} value={reponerCost} onChange={e => setReponerCost(e.target.value)} />
                    </div>
                  </div>
                  <button
                    className={styles.btnPrimary}
                    disabled={pending}
                    onClick={() => start(async () => {
                      await reponerStock(barbershopId, product.id, Number(reponerQty), Number(reponerCost))
                      setReponer(false)
                    })}
                  >
                    {pending ? '…' : 'Confirmar reposición'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </details>
    </>
  )
}
