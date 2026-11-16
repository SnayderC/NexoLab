import { useAuth } from './useAuth'

// Usuario de la sesión, para las pantallas protegidas por RequireAuth.
// RN-24 (D-45): el administrador trabaja en dos modos. En modo administrador gestiona y consulta;
// en modo técnico registra y cierra incidencias como un técnico.
export function useCurrentUser() {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser debe usarse dentro de una ruta protegida')

  const isAdmin = user.role.code === 'ADMIN'
  const isTechnicianMode = isAdmin && user.technician_mode

  return {
    user,
    // Rol de la cuenta, sin importar el modo.
    isAdmin,
    // Administrador que activó el modo técnico.
    isTechnicianMode,
    // Funciones de administración: laboratorios, equipos, catálogo, usuarios, anular y recalcular.
    canAdminister: isAdmin && !isTechnicianMode,
    // Registrar y cerrar incidencias: el técnico o el administrador en modo técnico.
    canOperateIncidents: !isAdmin || isTechnicianMode,
  }
}
