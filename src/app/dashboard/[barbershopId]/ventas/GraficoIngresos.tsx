'use client'

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useState, useMemo } from 'react'
import { TooltipContent } from '@/lib/definitions'
import styles from './ventas.module.css'

interface DayData { fecha: string; servicios: number; productos: number }
interface Props    { data: DayData[] }
type Vista = 'total' | 'servicios' | 'productos'

const TZ = 'America/Argentina/Buenos_Aires'

const fmtFull = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function fmtARS(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`
  return `$${n}`
}

const shortDate = (iso: string) => { const [,m,d] = iso.split('-'); return `${d}/${m}` }
const weekLabel = (iso: string) => { const [,m,d] = iso.split('-'); return `${d}/${m}` }

function groupByWeek(data: DayData[]) {
  const map = new Map<string, { servicios: number; productos: number }>()
  for (const d of data) {
    const date = new Date(d.fecha + 'T12:00:00')
    const day  = date.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const mon  = new Date(date)
    mon.setDate(date.getDate() + diff)
    const key  = mon.toLocaleDateString('en-CA', { timeZone: TZ })
    const prev = map.get(key) ?? { servicios: 0, productos: 0 }
    map.set(key, { servicios: prev.servicios + d.servicios, productos: prev.productos + d.productos })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, v]) => ({ fecha, ...v }))
}

const VISTAS: { key: Vista; label: string }[] = [
  { key: 'total',     label: 'Total'     },
  { key: 'servicios', label: 'Servicios' },
  { key: 'productos', label: 'Productos' },
]

interface TooltipProps extends TooltipContent {
  vista?: Vista
  weekly?: boolean
}

const Tooltip_ = ({ active, payload, label, vista, weekly }: TooltipProps) => {
  if (!active || !payload?.length) return null
  const s = payload.find((p) => p.dataKey === 'servicios')?.value ?? 0
  const pr = payload.find((p) => p.dataKey === 'productos')?.value ?? 0
  const labelStr = String(label ?? '')
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:'.82rem' }}>
      <p style={{ color:'var(--cream)', fontWeight:600, marginBottom:6 }}>
        {weekly ? `Semana del ${weekLabel(labelStr)}` : shortDate(labelStr)}
      </p>
      {vista === 'total' ? (
        <>
          <p style={{ color:'var(--gold)' }}>Servicios: {fmtFull(s)}</p>
          {pr > 0 && <p style={{ color:'#5ecf87' }}>Productos: {fmtFull(pr)}</p>}
          <p style={{ color:'#5ecf87', fontWeight:700, marginTop:4, borderTop:'1px solid var(--border)', paddingTop:4 }}>
            Total: {fmtFull(s + pr)}
          </p>
        </>
      ) : vista === 'servicios' ? (
        <p style={{ color:'var(--gold)', fontWeight:600 }}>{fmtFull(s)}</p>
      ) : (
        <p style={{ color:'#5ecf87', fontWeight:600 }}>{fmtFull(pr)}</p>
      )}
    </div>
  )
}

export default function GraficoIngresos({ data }: Props) {
  const [vista, setVista] = useState<Vista>('total')
  const isWeekly = data.length > 30

  const chartData = useMemo(() => {
    const base = isWeekly ? groupByWeek(data) : data
    if (vista === 'servicios') return base.map(d => ({ ...d, productos: 0 }))
    if (vista === 'productos') return base.map(d => ({ ...d, servicios: 0 }))
    return base
  }, [data, isWeekly, vista])

  if (data.length === 0) return null

  const barSize = chartData.length > 20 ? 8 : chartData.length > 10 ? 12 : 18
  const xInterval = chartData.length > 60 ? Math.floor(chartData.length / 10)
    : chartData.length > 14 ? Math.floor(chartData.length / 7) : 0

  const commonAxis = {
    xProps: {
      dataKey: 'fecha',
      tickFormatter: isWeekly ? weekLabel : shortDate,
      tick: { fill: 'var(--muted)', fontSize: 11 },
      axisLine: false, tickLine: false,
      interval: xInterval,
    },
    yProps: {
      tickFormatter: fmtARS,
      tick: { fill: 'var(--muted)', fontSize: 11 },
      axisLine: false, tickLine: false,
      width: 48,
    },
  }

  return (
    <div className={styles.chartBox}>
      <div className={styles.chartHeader}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <p className={styles.chartTitle}>Ingresos por {isWeekly ? 'semana' : 'día'}</p>
          {isWeekly && <span className={styles.chartBadge}>vista semanal</span>}
        </div>
        <div className={styles.chartTabs}>
          {VISTAS.map(v => (
            <button key={v.key}
              className={vista === v.key ? styles.chartTabActive : styles.chartTab}
              onClick={() => setVista(v.key)}
            >{v.label}</button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        {isWeekly ? (
          <LineChart data={chartData} margin={{ top:4, right:8, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hover)" vertical={false} />
            <XAxis {...commonAxis.xProps} />
            <YAxis {...commonAxis.yProps} />
            <Tooltip content={<Tooltip_ vista={vista} weekly />} cursor={{ stroke:'rgba(255,255,255,.08)', strokeWidth:1 }} />
            {(vista === 'total' || vista === 'productos') && (
              <Line dataKey="productos" stroke="#5ecf87" strokeWidth={2} dot={false} />
            )}
            {(vista === 'total' || vista === 'servicios') && (
              <Line dataKey="servicios" stroke="var(--gold)" strokeWidth={2.5}
                dot={(props: { cx?: number; cy?: number; value?: number }) => {
                  const { cx, cy, value } = props
                  return cx && cy && value && value > 0
                    ? <circle key={`d${cx}`} cx={cx} cy={cy} r={3} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.5} />
                    : <g key={`d${cx ?? 0}`} />
                }}
              />
            )}
          </LineChart>
        ) : (
          <BarChart data={chartData} margin={{ top:4, right:8, left:0, bottom:0 }} barSize={barSize}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hover)" vertical={false} />
            <XAxis {...commonAxis.xProps} />
            <YAxis {...commonAxis.yProps} />
            <Tooltip content={<Tooltip_ vista={vista} />} cursor={{ fill:'rgba(255,255,255,.04)' }} />
            {(vista === 'total' || vista === 'servicios') && (
              <Bar dataKey="servicios" fill="var(--gold)"
                radius={vista === 'servicios' ? [3,3,0,0] : [0,0,0,0]} stackId="a" />
            )}
            {(vista === 'total' || vista === 'productos') && (
              <Bar dataKey="productos" fill="#5ecf87"
                radius={vista === 'productos' ? [3,3,0,0] : [3,3,0,0]} stackId="a" />
            )}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
