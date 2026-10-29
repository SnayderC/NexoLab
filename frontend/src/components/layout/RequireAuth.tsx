import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'
import PageLoader from '../ui/PageLoader'

// Sin sesión, lleva al login y recuerda a dónde quería ir el usuario.
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Mientras el servidor confirma si hay una sesión abierta, no se redirige todavía.
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return children
}

export default RequireAuth
