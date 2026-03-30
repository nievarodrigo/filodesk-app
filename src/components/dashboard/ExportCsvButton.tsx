'use client'

import { useRouter } from 'next/navigation'
import { downloadAsCSV } from '@/lib/export'

interface Props {
  data: Array<Record<string, unknown>>
  filename: string
  enabled: boolean
  barbershopId: string
  label?: string
}

export default function ExportCsvButton({
  data,
  filename,
  enabled,
  barbershopId,
  label = 'Descargar reporte',
}: Props) {
  const router = useRouter()

  function handleClick() {
    if (!enabled) {
      const shouldUpgrade = window.confirm(
        'La exportación de datos es una función exclusiva del Plan Pro. ¿Querés mejorar tu plan ahora?'
      )

      if (shouldUpgrade) {
        router.push(`/suscripcion?barbershopId=${barbershopId}`)
      }

      return
    }

    downloadAsCSV(data, filename)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 40,
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text)',
        cursor: 'pointer',
        fontSize: '.86rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0 }}>
        <path
          fill="currentColor"
          d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"
        />
      </svg>
      {label}
    </button>
  )
}
