import { LoaderCircle } from 'lucide-react'

// Indicador de carga a pantalla completa, por ejemplo mientras se verifica la sesión.
function PageLoader() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-background">
      <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}

export default PageLoader
