const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const MINUTES_PER_DAY = 24 * 60

function elapsedMs(from: string, now: string): number {
  return Math.max(0, new Date(now).getTime() - new Date(from).getTime())
}

// Tiempo transcurrido corto, como en la tabla del dashboard: "hace 25 min", "hace 19 h", "hace 2 d".
export function formatElapsed(from: string, now: string): string {
  const elapsed = elapsedMs(from, now)

  if (elapsed < HOUR_MS) return `hace ${Math.floor(elapsed / MINUTE_MS)} min`
  if (elapsed < DAY_MS) return `hace ${Math.floor(elapsed / HOUR_MS)} h`
  return `hace ${Math.floor(elapsed / DAY_MS)} d`
}

// Tiempo transcurrido largo, como en la lista de incidencias:
// "hace 0 min", "hace 2 h 15 min", "hace 19 h", "hace 1 día", "hace 4 días".
export function formatElapsedLong(from: string, now: string): string {
  const elapsed = elapsedMs(from, now)

  if (elapsed < HOUR_MS) return `hace ${Math.floor(elapsed / MINUTE_MS)} min`
  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS)
    const minutes = Math.floor((elapsed % HOUR_MS) / MINUTE_MS)
    return minutes > 0 && hours < 3 ? `hace ${hours} h ${minutes} min` : `hace ${hours} h`
  }
  return formatDaysAgo(Math.floor(elapsed / DAY_MS))
}

// Duración de la atención: "25 min", "1 h 05 min", "2 h 10 min", "1 día 0 h 25 min".
// Con horas, los minutos van con dos dígitos, como en el Figma 4.0.
export function formatDuration(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY)
  const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60)
  const minutes = totalMinutes % 60
  const paddedMinutes = String(minutes).padStart(2, '0')

  if (days > 0) return `${days} ${days === 1 ? 'día' : 'días'} ${hours} h ${paddedMinutes} min`
  if (hours > 0) return minutes > 0 ? `${hours} h ${paddedMinutes} min` : `${hours} h`
  return `${minutes} min`
}

// "hace 0 días", "hace 1 día", "hace 15 días".
export function formatDaysAgo(days: number): string {
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

// "1 día", "5 días".
export function formatDays(days: number): string {
  return `${days} ${days === 1 ? 'día' : 'días'}`
}
