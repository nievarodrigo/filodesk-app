'use client'

import styles from './finanzas.module.css'

type CustomRangePickerProps = {
  periodMode: 'mes' | 'ultima-semana' | 'custom'
  isBasePlan: boolean
  rangeAdjustedForPlan: boolean
  from: string
  to: string
  todayISO: string
  basePlanMinISO?: string
}

export default function CustomRangePicker({
  periodMode,
  isBasePlan,
  rangeAdjustedForPlan,
  from,
  to,
  todayISO,
  basePlanMinISO,
}: CustomRangePickerProps) {
  return (
    <details className={styles.customRangePicker}>
      <summary className={`${styles.customRangeTrigger} ${periodMode === 'custom' ? styles.customRangeTriggerActive : ''}`} aria-label="Rango personalizado">
        <svg viewBox="0 0 24 24" className={styles.calendarIcon} aria-hidden>
          <path d="M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <form
        className={styles.customRangeForm}
        method="get"
        onSubmit={(event) => {
          const form = event.currentTarget
          const fromInput = form.elements.namedItem('desde') as HTMLInputElement | null
          const toInput = form.elements.namedItem('hasta') as HTMLInputElement | null
          if (!fromInput || !toInput) return
          if (fromInput.value && toInput.value && fromInput.value > toInput.value) {
            const temp = fromInput.value
            fromInput.value = toInput.value
            toInput.value = temp
          }
        }}
      >
        <input type="hidden" name="periodo" value="custom" />
        <label className={styles.customRangeField}>
          <span>Desde</span>
          <input type="date" name="desde" defaultValue={from} max={todayISO} min={isBasePlan ? basePlanMinISO : undefined} />
        </label>
        <label className={styles.customRangeField}>
          <span>Hasta</span>
          <input type="date" name="hasta" defaultValue={to} max={todayISO} min={isBasePlan ? basePlanMinISO : undefined} />
        </label>
        <button type="submit" className={styles.customRangeSubmit}>Aplicar</button>
        {isBasePlan && (
          <p className={styles.customRangeHint}>En el Plan Base podés filtrar entre fechas de los últimos 6 meses. ¡Pasate a Pro para ver todo el historial!</p>
        )}
        {rangeAdjustedForPlan && (
          <p className={styles.customRangeWarning}>Rango ajustado automáticamente al límite de 6 meses.</p>
        )}
      </form>
    </details>
  )
}
