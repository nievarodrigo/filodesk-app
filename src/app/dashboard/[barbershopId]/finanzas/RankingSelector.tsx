'use client'

import { useState } from 'react'
import GraficoProductos from '../productos/GraficoProductos'
import styles from './RankingSelector.module.css'

interface RankingItem {
  name: string
  count?: number
  total?: number
  cantidad?: number
  ingresos?: number
}

interface Props {
  svcRanking: RankingItem[]
  prodRanking: RankingItem[]
  svcPieData: RankingItem[]
  prodPieData: RankingItem[]
  formatARS: (n: number) => string
}

export default function RankingSelector({
  svcRanking,
  prodRanking,
  svcPieData,
  prodPieData,
  formatARS,
}: Props) {
  const [type, setType] = useState<'servicios' | 'productos'>('servicios')

  const ranking = type === 'servicios' ? svcRanking : prodRanking
  const pieData = type === 'servicios' ? svcPieData : prodPieData
  const isServicios = type === 'servicios'
  const countLabel = isServicios ? 'servicios' : 'unidades'
  const title = isServicios ? 'Top Servicios' : 'Top Productos'

  return (
    <div>
      <div className={styles.controls}>
        <button
          onClick={() => setType('servicios')}
          className={`${styles.controlBtn} ${type === 'servicios' ? styles.controlBtnActive : ''}`}
        >
          Servicios
        </button>
        <button
          onClick={() => setType('productos')}
          className={`${styles.controlBtn} ${type === 'productos' ? styles.controlBtnActive : ''}`}
        >
          Productos
        </button>
      </div>

      <div className={styles.contentGrid}>
        {ranking.length > 0 && (
          <div className={styles.rankingCard}>
            <p className={styles.cardTitle}>{title}</p>
            <div className={styles.rankingList}>
              {ranking.map((item, i) => {
                const count = isServicios ? (item.count ?? 0) : (item.cantidad ?? 0)
                const total = isServicios ? (item.total ?? 0) : (item.ingresos ?? 0)
                return (
                  <div key={item.name} className={styles.rankingRow}>
                    <div className={styles.rankingLeft}>
                      <span className={styles.rankNum}>#{i + 1}</span>
                      <span className={styles.rankName}>{item.name}</span>
                    </div>
                    <div className={styles.rankingRight}>
                      <span className={styles.rankCount}>{count} {countLabel}</span>
                      <span className={styles.rankTotal}>{formatARS(total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {pieData.length > 0 && <GraficoProductos data={pieData} />}
      </div>
    </div>
  )
}
