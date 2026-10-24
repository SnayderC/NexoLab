import { createContext } from 'react'
import type { SessionUser } from './api'

export type AuthContextValue = {
  user: SessionUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
