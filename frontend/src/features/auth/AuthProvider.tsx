import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from './api'
import { AuthContext } from './authContext'

function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<authApi.SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Al abrir la aplicación se pregunta al servidor si la cookie de sesión sigue vigente.
  useEffect(() => {
    authApi
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authApi.login(email, password))
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      // Ningún dato del usuario anterior queda en caché.
      queryClient.clear()
    }
  }, [queryClient])

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
