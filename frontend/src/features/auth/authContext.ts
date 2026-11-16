import { createContext } from 'react'
import type { SessionUser } from './api'

export type AuthContextValue = {
  user: SessionUser | null
  // true mientras se consulta al servidor si ya hay una sesión abierta.
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  // Solo administrador (RN-24).
  setTechnicianMode: (enabled: boolean) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
