import { RefreshCw, TriangleAlert } from 'lucide-react'
import Button from './Button'

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry: () => void
}

// Pantalla de error con botón "Reintentar" (sección 11). Sigue el estilo de EmptyState.
function ErrorState({
  title = 'No se pudo cargar la información',
  description = 'Revisa tu conexión e inténtalo de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-90 flex-col items-center justify-center gap-5 px-6 py-10 text-center"
    >
      <TriangleAlert className="size-10 text-danger" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">{title}</p>
        <p className="text-text-muted">{description}</p>
      </div>
      <Button icon={RefreshCw} onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

export default ErrorState
