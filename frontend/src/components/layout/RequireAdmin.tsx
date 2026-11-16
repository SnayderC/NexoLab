import { Outlet } from 'react-router'
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import AccessDeniedPage from '../../features/auth/pages/AccessDeniedPage'

// Solo oculta la interfaz: los permisos reales los aplica el backend.
// RN-24: en modo técnico el administrador no ve la administración hasta volver a su modo.
function RequireAdmin() {
  const { canAdminister, isTechnicianMode } = useCurrentUser()

  if (canAdminister) return <Outlet />
  if (isTechnicianMode) {
    return (
      <AccessDeniedPage
        message="Estás en modo técnico. Vuelve al modo administrador para usar esta sección."
        switchToTechnicianMode={false}
      />
    )
  }
  return <AccessDeniedPage />
}

export default RequireAdmin
