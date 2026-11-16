import { Navigate, useLocation } from 'react-router'
import PageLoader from '../../../components/ui/PageLoader'
import BrandPanel from '../components/BrandPanel'
import LoginForm from '../components/LoginForm'
import { useAuth } from '../useAuth'

function LoginPage() {
  const { user, isLoading, sessionExpired, login } = useAuth()
  const location = useLocation()
  // Si RequireAuth lo trajo aquí, vuelve a la pantalla que quería ver.
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (isLoading) return <PageLoader />
  // Con sesión iniciada (también justo después de entrar), sale del login.
  if (user) return <Navigate to={from} replace />

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <BrandPanel />
      <main className="flex items-center justify-center px-4 py-10">
        <LoginForm onLogin={login} sessionExpired={sessionExpired} />
      </main>
    </div>
  )
}

export default LoginPage
