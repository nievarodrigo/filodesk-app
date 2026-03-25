const TZ = 'America/Argentina/Buenos_Aires'

/** YYYY-MM-DD en hora argentina */
export function today(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

/** YYYY-MM-01 en hora argentina */
export function startOfMonth(): string {
  return today().slice(0, 7) + '-01'
}

/** YYYY-MM del mes actual en hora argentina */
export function currentYM(): string {
  return today().slice(0, 7)
}

/** YYYY-MM-DD del lunes de la semana actual en hora argentina */
export function startOfWeek(): string {
  const t = today()
  const d = new Date(t + 'T12:00:00Z')
  const day = d.getUTCDay()
  const diffToMon = day === 0 ? 6 : day - 1
  d.setUTCDate(d.getUTCDate() - diffToMon)
  return d.toISOString().split('T')[0]
}
