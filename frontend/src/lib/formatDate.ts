// Las fechas se muestran en la hora de Ecuador, sin importar la zona del navegador.
const TIME_ZONE = 'America/Guayaquil'
// Ecuador continental no tiene horario de verano: siempre UTC−5.
const ECUADOR_OFFSET = '-05:00'

const dateFormatter = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: TIME_ZONE,
})

const timeFormatter = new Intl.DateTimeFormat('es-EC', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
})

// Partes de la fecha en Ecuador, para armar los valores de los campos de fecha.
const isoPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
})

// Formato dd/mm/aaaa, como en el prototipo.
export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date))
}

// Formato hh:mm (24 horas).
export function formatTime(date: Date | string): string {
  return timeFormatter.format(new Date(date))
}

// Formato dd/mm/aaaa hh:mm, por ejemplo "17/10/2026 10:42".
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

// Fecha ISO → valor de <input type="datetime-local"> en hora de Ecuador ("2026-10-17T11:30").
export function toDateTimeInputValue(date: Date | string): string {
  const parts = Object.fromEntries(
    isoPartsFormatter.formatToParts(new Date(date)).map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

// Valor de <input type="datetime-local"> (hora de Ecuador) → fecha ISO con zona horaria.
export function fromDateTimeInputValue(value: string): string {
  return `${value}:00${ECUADOR_OFFSET}`
}

// Fecha ISO → "aaaa-mm-dd" en hora de Ecuador, para comparar con <input type="date">.
export function toDateInputValue(date: Date | string): string {
  return toDateTimeInputValue(date).slice(0, 10)
}
