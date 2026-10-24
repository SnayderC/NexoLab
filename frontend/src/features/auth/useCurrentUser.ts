import { useAuth } from './useAuth'

// Usuario de la sesión, para las pantallas protegidas por RequireAuth.
export function useCurrentUser() {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser debe usarse dentro de una ruta protegida')

  return {
    user,
    isAdmin: user.role.code === 'ADMIN',
  }
}
