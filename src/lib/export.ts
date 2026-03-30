'use client'

function escapeCSVValue(value: unknown) {
  const normalized = value === null || value === undefined ? '' : String(value)
  const escaped = normalized.replace(/"/g, '""')

  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
}

export function downloadAsCSV(data: Array<Record<string, unknown>>, filename: string) {
  if (!data.length) return

  const headers = Array.from(
    data.reduce((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key))
      return keys
    }, new Set<string>())
  )

  const csvRows = [
    headers.join(','),
    ...data.map((row) => headers.map((header) => escapeCSVValue(row[header])).join(',')),
  ]

  const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
