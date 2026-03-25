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
