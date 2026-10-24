import type { ReactNode } from 'react'

// Dato de solo lectura: etiqueta gris arriba y valor debajo.
function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-xs leading-4.5 text-text-muted">{label}</p>
      <div className="leading-5">{children}</div>
    </div>
  )
}

export default DetailField
