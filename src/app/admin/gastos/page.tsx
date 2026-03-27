import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import * as adminRepo from '@/repositories/admin.repository'
import { addExpense, deleteExpense } from '@/app/actions/admin'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Gastos — Admin FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

const CATEGORIES = ['hosting', 'dominio', 'publicidad', 'herramientas', 'otros']

export default async function AdminGastosPage() {
  const supabase = createServiceClient()
  const expenses = await adminRepo.getAllExpenses(supabase)

  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)

  // Agrupar por categoría
  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Gastos operativos</h1>
        <span className={styles.total}>Total: {formatARS(total)}</span>
      </div>

      <div className={styles.twoCol}>
        {/* Formulario */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Agregar gasto</p>
          <form action={addExpense} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Descripción</label>
              <input name="description" required placeholder="Ej: Vercel Pro" className={styles.input} />
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Monto (ARS)</label>
                <input name="amount" type="number" min="0" step="0.01" required placeholder="0.00" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Fecha</label>
                <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={styles.input} />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Categoría</label>
              <select name="category" required className={styles.input}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <button type="submit" className={styles.btn}>Agregar</button>
          </form>
        </div>

        {/* Resumen por categoría */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Por categoría</p>
          <div className={styles.catList}>
            {CATEGORIES.filter(c => byCategory[c]).map(c => (
              <div key={c} className={styles.catRow}>
                <span className={styles.catName}>{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                <span className={styles.catAmount}>{formatARS(byCategory[c])}</span>
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && (
              <p className={styles.empty}>Sin gastos registrados</p>
            )}
          </div>
        </div>
      </div>

      {/* Lista completa */}
      <div className={styles.card} style={{ marginTop: 24 }}>
        <p className={styles.cardTitle}>Todos los gastos</p>
        {expenses.length === 0 ? (
          <p className={styles.empty}>Sin gastos registrados</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Descripción</span>
              <span>Categoría</span>
              <span>Fecha</span>
              <span>Monto</span>
              <span></span>
            </div>
            {expenses.map((e: any) => (
              <div key={e.id} className={styles.tableRow}>
                <span>{e.description}</span>
                <span className={styles.cat}>{e.category}</span>
                <span className={styles.muted}>
                  {new Date(e.date).toLocaleDateString('es-AR')}
                </span>
                <span className={styles.amount}>{formatARS(e.amount)}</span>
                <form action={deleteExpense.bind(null, e.id)}>
                  <button type="submit" className={styles.deleteBtn} title="Eliminar">✕</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
