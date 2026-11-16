import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setSessionExpiredHandler } from '../../lib/apiClient'
import * as authApi from './api'
import { AuthContext } from './authContext'

function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<authApi.SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Al abrir la aplicación se pregunta al servidor si la cookie de sesión sigue vigente.
  useEffect(() => {
    authApi
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  // D-47: si cualquier petición recibe 401, la sesión venció. Se olvida al usuario y RequireAuth lleva al login,
  // que recuerda la pantalla en la que estaba.
  useEffect(() => {
    // Solo lo llaman las rutas que no son de la sesión, así que siempre había un usuario dentro.
    setSessionExpiredHandler(() => {
      setUser(null)
      setSessionExpired(true)
      queryClient.clear()
    })
    return () => setSessionExpiredHandler(null)
  }, [queryClient])

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authApi.login(email, password))
    setSessionExpired(false)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setSessionExpired(false)
      // Ningún dato del usuario anterior queda en caché.
      queryClient.clear()
    }
  }, [queryClient])

  const setTechnicianMode = useCallback(async (enabled: boolean) => {
    setUser(await authApi.setTechnicianMode(enabled))
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, sessionExpired, login, logout, setTechnicianMode }),
    [user, isLoading, sessionExpired, login, logout, setTechnicianMode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
