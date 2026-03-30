'use client'

import { useActionState, useState } from 'react'
import { createVenta, type CreateVentaState } from '@/app/actions/venta'
import styles from './ventas.module.css'

interface Barber      { id: string; name: string; commission_pct: number }
interface ServiceType { id: string; name: string; default_price: number | null }
interface ServiceRow  { id: number; service_type_id: string; quantity: string; amount: string }

interface Props {
  barbershopId: string
  barbers: Barber[]
  serviceTypes: ServiceType[]
  compact?: boolean          // para usar en la página de inicio
  showOnboardingHint?: boolean
}

let _id = 1
function newRow(): ServiceRow { return { id: _id++, service_type_id: '', quantity: '1', amount: '' } }

function todayStr() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) }

export default function NuevaVentaForm({ barbershopId, barbers, serviceTypes, compact, showOnboardingHint }: Props) {
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [rows, setRows] = useState<ServiceRow[]>([newRow()])

  const action = createVenta.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<CreateVentaState, FormData>(action, undefined)

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0) * Math.max(1, Number(r.quantity) || 1), 0)
  const commission = selectedBarber && total > 0
    ? Math.round(total * selectedBarber.commission_pct / 100)
    : null

  function addRow() {
    setRows(r => [...r, newRow()])
  }

  function removeRow(id: number) {
    if (rows.length === 1) return
    setRows(r => r.filter(row => row.id !== id))
  }

  function updateRow(id: number, field: keyof ServiceRow, value: string) {
    setRows(r => r.map(row => {
      if (row.id !== id) return row
      if (field === 'service_type_id') {
        const svc = serviceTypes.find(s => s.id === value)
        return {
          ...row,
          service_type_id: value,
          amount: svc?.default_price ? String(svc.default_price) : row.amount,
        }
      }
      return { ...row, [field]: value }
    }))
  }

  function handleReset() {
    setSelectedBarber(null)
    setRows([newRow()])
  }

  return (
    <form action={formAction} className={compact ? styles.formCompact : styles.formCard}>
      {!compact && <h3 className={styles.formTitle}>Registrar venta</h3>}

      {state?.message && <p className={styles.errorBox}>{state.message}</p>}

      {showOnboardingHint && (
        <div className={styles.onboardingHint}>
          <span className={styles.onboardingDot}>1</span>
          <p>Hacé clic acá para marcar tu primer corte del día.</p>
        </div>
      )}

      <input type="hidden" name="date" value={todayStr()} />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="barber_id">Barbero *</label>
        <select
          id="barber_id"
          name="barber_id"
          className={styles.select}
          defaultValue=""
          onChange={e => setSelectedBarber(barbers.find(b => b.id === e.target.value) ?? null)}
        >
          <option value="" disabled>Seleccioná un barbero</option>
          {barbers.map(b => (
            <option key={b.id} value={b.id}>{b.name} ({b.commission_pct}%)</option>
          ))}
        </select>
      </div>

      {/* Filas de servicios */}
      <div className={styles.servicesSection}>
        <div className={styles.servicesHead}>
          <span>Servicio</span>
          <span>Cant.</span>
          <span>Precio unit.</span>
          <span></span>
        </div>

        {rows.map((row) => (
          <div key={row.id} className={styles.serviceRow}>
            <select
              name="service_type_id[]"
              className={styles.select}
              value={row.service_type_id}
              onChange={e => updateRow(row.id, 'service_type_id', e.target.value)}
            >
              <option value="" disabled>Seleccioná</option>
              {serviceTypes.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <input
              name="quantity[]"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              className={styles.input}
              value={row.quantity}
              onChange={e => updateRow(row.id, 'quantity', e.target.value)}
              style={{ width: 56, textAlign: 'center' }}
              title="Cantidad"
            />

            <input
              name="amount[]"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              placeholder="precio"
              className={styles.input}
              value={row.amount}
              onChange={e => updateRow(row.id, 'amount', e.target.value)}
            />

            <button
              type="button"
              className={styles.btnRemoveRow}
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              title="Quitar"
            >✕</button>
          </div>
        ))}

        {/* Agregar servicio inline */}
        <button type="button" className={styles.btnAddRow} onClick={addRow}>
          + agregar servicio
        </button>

        {total > 0 && (
          <div className={styles.totals}>
            <span>Total: <strong style={{ color: 'var(--green)' }}>${total.toLocaleString('es-AR')}</strong></span>
            {commission !== null && (
              <span>Comisión {selectedBarber?.name}: <strong style={{ color: 'var(--gold)' }}>${commission.toLocaleString('es-AR')}</strong></span>
            )}
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="notes">Notas <span className={styles.optional}>(opcional)</span></label>
        <input id="notes" name="notes" type="text" className={styles.input} placeholder="Ej: cliente nuevo, combo…" />
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.btnSecondary} onClick={handleReset}>Limpiar</button>
        <button type="submit" className={styles.btnPrimary} disabled={pending}>
          {pending ? 'Guardando…' : `Registrar${rows.length > 1 ? ` (${rows.length})` : ''}`}
        </button>
      </div>
    </form>
  )
}
