const decimalFormatter = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 })

// Decimal con coma y hasta un decimal: 9.2 → "9,2", 3 → "3".
export function formatDecimal(value: number): string {
  return decimalFormatter.format(value)
}
