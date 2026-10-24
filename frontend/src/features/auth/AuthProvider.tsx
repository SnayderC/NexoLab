import { useCallback, useMemo, useState, type ReactNode } from 'react'
import * as authApi from './api'
import { AuthContext } from './authContext'

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(() => authApi.getSession())

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authApi.login(email, password))
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
