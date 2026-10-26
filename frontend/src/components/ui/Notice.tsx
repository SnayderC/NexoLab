import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

// Aviso gris con ícono de información, como "Equipo retirado el…" (Figma 4.2).
function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
      <Info className="size-5 shrink-0 text-text-muted" aria-hidden />
      <p className="flex-1 leading-5 text-text-muted">{children}</p>
    </div>
  )
}

export default Notice
