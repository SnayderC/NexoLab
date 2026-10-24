import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'

// Sin sesión, lleva al login y recuerda a dónde quería ir el usuario.
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return children
}

export default RequireAuth
