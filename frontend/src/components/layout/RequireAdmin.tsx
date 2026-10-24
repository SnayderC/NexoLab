import { Outlet } from 'react-router'
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import AccessDeniedPage from '../../features/auth/pages/AccessDeniedPage'

// Solo oculta la interfaz: los permisos reales los aplica el backend.
function RequireAdmin() {
  const { isAdmin } = useCurrentUser()

  return isAdmin ? <Outlet /> : <AccessDeniedPage />
}

export default RequireAdmin
