'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import styles from './peakHours.module.css'

type Point = { label: string; y: number }

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

export default function PeakHoursChart({ hourlyData }: { hourlyData: Point[] }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>Horas pico</span>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={hourlyData} margin={{ top: 10, right: 8, bottom: 0, left: -32 }}>
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#5ecf87" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#5ecf87" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            hide
            domain={[0, (max: number) => Math.max(max * 1.5, 4)]}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke="#5ecf87"
            strokeWidth={2}
            fill="url(#greenGrad)"
            dot={{ fill: '#5ecf87', strokeWidth: 0, r: 3 }}
            activeDot={{ fill: '#5ecf87', stroke: 'var(--surface)', strokeWidth: 2, r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
