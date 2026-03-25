'use client'

import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useState, useMemo } from 'react'
import styles from '../ventas/ventas.module.css'

interface DayData { fecha: string; amount: number; category: string }
interface Props    { data: DayData[] }

const CATEGORY_COLORS: Record<string, string> = {
  Alquiler:  '#c9a84c',
  Productos: '#5ecf87',
  Servicios: '#7eb8f7',
  Sueldos:   '#e07070',
  Otros:     '#7a7060',
}

const fmtFull = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function fmtARS(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`
  return `$${n}`
}

const shortDate = (iso: string) => { const [,m,d] = iso.split('-'); return `${d}/${m}` }

const Tooltip_ = ({ active, payload, label, cat, categories }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div style={{ background:'#1e1e1e', border:'1px solid #3a3a3a', borderRadius:8, padding:'10px 14px', fontSize:'.82rem' }}>
      <p style={{ color:'#d4c5a9', fontWeight:600, marginBottom:6 }}>{shortDate(label)}</p>
      {cat === 'Todos' ? (
        <>
          {payload.map((p: any) => p.value > 0 && (
            <p key={p.dataKey} style={{ color: CATEGORY_COLORS[p.dataKey] ?? '#a0a0a0' }}>
              {p.dataKey}: {fmtFull(p.value)}
            </p>
          ))}
          {payload.length > 1 && (
            <p style={{ color:'#d4c5a9', fontWeight:700, marginTop:4, borderTop:'1px solid #3a3a3a', paddingTop:4 }}>
              Total: {fmtFull(total)}
            </p>
          )}
        </>
      ) : (
        <p style={{ color: CATEGORY_COLORS[cat] ?? '#a0a0a0', fontWeight:600 }}>{fmtFull(total)}</p>
      )}
    </div>
  )
}

export default function GraficoGastos({ data }: Props) {
  const categories = useMemo(() => {
    const cats = Array.from(new Set(data.map(d => d.category))).sort()
    return ['Todos', ...cats]
  }, [data])

  const [cat, setCat] = useState<string>('Todos')

  // When Todos: one field per category per day (for stacked bars)
  // When filtered: single `amount` field
  const chartData = useMemo(() => {
    if (cat !== 'Todos') {
      const map: Record<string, number> = {}
      for (const d of data) {
        if (d.category !== cat) continue
        map[d.fecha] = (map[d.fecha] ?? 0) + d.amount
      }
      return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([fecha, amount]) => ({ fecha, [cat]: amount }))
    }

    // Todos: pivot by category
    const map: Record<string, Record<string, number>> = {}
    for (const d of data) {
      if (!map[d.fecha]) map[d.fecha] = {}
      map[d.fecha][d.category] = (map[d.fecha][d.category] ?? 0) + d.amount
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, cats]) => ({ fecha, ...cats }))
  }, [data, cat])

  if (data.length === 0) return null

  const activeCats = cat === 'Todos'
    ? categories.filter(c => c !== 'Todos')
    : [cat]

  const barSize  = chartData.length > 20 ? 8 : chartData.length > 10 ? 12 : 18
  const xInterval = chartData.length > 14 ? Math.floor(chartData.length / 7) : 0

  return (
    <div className={styles.chartBox}>
      <div className={styles.chartHeader}>
        <p className={styles.chartTitle}>Gastos por día</p>
        <div className={styles.chartTabs}>
          {categories.map(c => (
            <button key={c}
              className={cat === c ? styles.chartTabActive : styles.chartTab}
              onClick={() => setCat(c)}
            >{c}</button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top:4, right:8, left:0, bottom:0 }} barSize={barSize}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="fecha"
            tickFormatter={shortDate}
            tick={{ fill: '#7a7060', fontSize: 11 }}
            axisLine={false} tickLine={false}
            interval={xInterval}
          />
          <YAxis
            tickFormatter={fmtARS}
            tick={{ fill: '#7a7060', fontSize: 11 }}
            axisLine={false} tickLine={false}
            width={48}
          />
          <Tooltip content={<Tooltip_ cat={cat} categories={activeCats} />} cursor={{ fill:'rgba(255,255,255,.04)' }} />
          {activeCats.map((c, i) => (
            <Bar
              key={c}
              dataKey={c}
              stackId="a"
              fill={CATEGORY_COLORS[c] ?? '#a0a0a0'}
              radius={i === activeCats.length - 1 ? [3,3,0,0] : [0,0,0,0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
