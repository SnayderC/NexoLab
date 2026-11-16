import { LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/toast/useToast'
import { useAuth } from '../useAuth'

type AccessDeniedPageProps = {
  message?: string
  // Administrador en el modo equivocado (RN-24): botón para cambiar al modo que pide la sección.
  switchToTechnicianMode?: boolean
}

// Figma "5.19 Acceso restringido": un técnico entra a una ruta de administración (RN-06).
// También la ve el administrador que entra a una sección de otro modo (RN-24, D-45).
function AccessDeniedPage({
  message = 'Esta sección es solo para administradores.',
  switchToTechnicianMode,
}: AccessDeniedPageProps) {
  const navigate = useNavigate()
  const { setTechnicianMode } = useAuth()
  const { showToast } = useToast()
  const [isSwitching, setIsSwitching] = useState(false)

  async function switchMode(enabled: boolean) {
    setIsSwitching(true)
    try {
      await setTechnicianMode(enabled)
      showToast({ message: enabled ? 'Modo técnico activado' : 'Volviste al modo administrador' })
    } catch {
      showToast({ message: 'No se pudo cambiar de modo', tone: 'error' })
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-border-subtle">
        <LockKeyhole className="size-8 text-text-muted" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold">Acceso restringido</h1>
      <p className="text-text-muted">{message}</p>
      <div className="flex gap-3">
        {switchToTechnicianMode !== undefined && (
          <Button variant="primary" disabled={isSwitching} onClick={() => switchMode(switchToTechnicianMode)}>
            {switchToTechnicianMode ? 'Activar modo técnico' : 'Volver al modo administrador'}
          </Button>
        )}
        <Button
          variant={switchToTechnicianMode === undefined ? 'primary' : 'secondary'}
          onClick={() => navigate('/')}
          className="w-51.5"
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  )
}

export default AccessDeniedPage
