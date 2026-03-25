'use client'

import { useActionState, useState } from 'react'
import { createProducto, type ProductoState } from '@/app/actions/producto'
import styles from './productos.module.css'

interface Props { barbershopId: string }

export default function NuevoProductoForm({ barbershopId }: Props) {
  const [open, setOpen] = useState(false)
  const action = createProducto.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<ProductoState, FormData>(action, undefined)

  return (
    <div>
      <button className={styles.btnPrimary} onClick={() => setOpen(o => !o)}>
        {open ? 'Cancelar' : '+ Agregar producto'}
      </button>

      {open && (
        <div className={styles.formCard} style={{ marginTop: 16 }}>
          <h3 className={styles.formTitle}>Nuevo producto</h3>
          <form action={formAction} className={styles.form}>
            {state?.message && <p className={styles.errorBox}>{state.message}</p>}
            <div className={styles.formGrid}>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label} htmlFor="name">Nombre *</label>
                <input id="name" name="name" type="text" className={styles.input} placeholder="Ej: Gel capilar, Gaseosa 354ml" autoFocus />
                {state?.errors?.name && <p className={styles.error}>{state.errors.name[0]}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="cost_price">Precio de costo (ARS)</label>
                <input id="cost_price" name="cost_price" type="number" min="0" step="1" className={styles.input} placeholder="Ej: 800" />
                {state?.errors?.cost_price && <p className={styles.error}>{state.errors.cost_price[0]}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="sale_price">Precio de venta (ARS) *</label>
                <input id="sale_price" name="sale_price" type="number" min="1" step="1" className={styles.input} placeholder="Ej: 1500" />
                {state?.errors?.sale_price && <p className={styles.error}>{state.errors.sale_price[0]}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="stock">Stock inicial</label>
                <input id="stock" name="stock" type="number" min="0" step="1" defaultValue="0" className={styles.input} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={pending}>
                {pending ? 'Guardando…' : 'Crear producto'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
