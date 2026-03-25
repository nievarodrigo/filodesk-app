'use client'

import { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './peakHours.module.css'

type Point = { x: number; label: string; y: number }

type Props = {
  hourlyData: Point[]
  dailyData: Point[]
}

function CustomDot(props: any) {
  const { cx, cy, payload, yAxis } = props
  if (!payload || payload.y === undefined) return null
  const maxY = yAxis?.niceTicks?.at(-1) ?? 1
  const ratio = maxY > 0 ? payload.y / maxY : 0
  const r = payload.y === 0 ? 3 : 5 + ratio * 7
  const bottom = yAxis ? yAxis.y + yAxis.height : cy
  return (
    <g>
      {payload.y > 0 && (
        <line
          x1={cx} y1={cy + r} x2={cx} y2={bottom}
          stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3"
        />
      )}
      <circle
        cx={cx} cy={cy} r={r}
        fill="var(--gold)" fillOpacity={payload.y === 0 ? 0.15 : 0.15 + ratio * 0.75}
        stroke="var(--gold)" strokeWidth={payload.y === 0 ? 0 : 1.5}
      />
      {payload.y > 0 && (
        <text
          x={cx} y={cy + 0.5}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fontWeight="700" fill="var(--bg)"
        >
          {payload.y}
        </text>
      )}
    </g>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as Point
  if (!d) return null
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{d.label}</span>
      <span className={styles.tooltipVal}>{d.y} {d.y === 1 ? 'cliente' : 'clientes'}</span>
    </div>
  )
}

export default function PeakHoursChart({ hourlyData, dailyData }: Props) {
  const [mode, setMode] = useState<'hour' | 'day'>('hour')
  const data = mode === 'hour' ? hourlyData : dailyData

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>Horas pico</span>
        <div className={styles.toggle}>
          <button
            className={`${styles.tab} ${mode === 'hour' ? styles.tabActive : ''}`}
            onClick={() => setMode('hour')}
          >
            Por hora
          </button>
          <button
            className={`${styles.tab} ${mode === 'day' ? styles.tabActive : ''}`}
            onClick={() => setMode('day')}
          >
            Por día
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <ScatterChart margin={{ top: 20, right: 16, bottom: 0, left: -10 }}>
          <XAxis
            type="number"
            dataKey="x"
            domain={[-0.5, data.length - 0.5]}
            ticks={data.map((_, i) => i)}
            tickFormatter={(v) => data[v]?.label ?? ''}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            hide
            domain={[0, (max: number) => Math.max(max * 1.4, 4)]}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
