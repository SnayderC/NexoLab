import { LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router'
import Button from '../../../components/ui/Button'

// Figma "5.19 Acceso restringido": un técnico entra a una ruta de administración (RN-06).
function AccessDeniedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-border-subtle">
        <LockKeyhole className="size-8 text-text-muted" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold">Acceso restringido</h1>
      <p className="text-text-muted">Esta sección es solo para administradores.</p>
      <Button variant="primary" onClick={() => navigate('/')} className="w-51.5">
        Volver al Dashboard
      </Button>
    </div>
  )
}

export default AccessDeniedPage
