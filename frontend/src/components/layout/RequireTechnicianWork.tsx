import { Outlet } from 'react-router'
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import AccessDeniedPage from '../../features/auth/pages/AccessDeniedPage'

// RN-24 (D-45): registrar incidencias es trabajo del técnico. El administrador debe activar el modo técnico.
// Solo oculta la interfaz: el backend responde 403 de todas formas.
function RequireTechnicianWork() {
  const { canOperateIncidents } = useCurrentUser()

  return canOperateIncidents ? (
    <Outlet />
  ) : (
    <AccessDeniedPage
      message="Registrar incidencias es tarea del técnico. Activa el modo técnico para hacerlo."
      switchToTechnicianMode
    />
  )
}

export default RequireTechnicianWork
