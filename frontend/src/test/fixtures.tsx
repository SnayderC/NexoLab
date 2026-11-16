// Datos y ayudantes de prueba (D-53). Solo los usan los archivos *.test.tsx, nunca la aplicación.
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../features/auth/authContext'
import type { SessionUser } from '../features/auth/api'

const CONTROL = { is_active: true, created_at: '2026-11-01T10:00:00-05:00', updated_at: '2026-11-01T10:00:00-05:00' }

export function sessionUser(role: 'TECHNICIAN' | 'ADMIN', technicianMode = false): SessionUser {
  return {
    ...CONTROL,
    id: role === 'ADMIN' ? 1 : 2,
    role_id: role === 'ADMIN' ? 2 : 1,
    role: { ...CONTROL, id: role === 'ADMIN' ? 2 : 1, code: role, name: role === 'ADMIN' ? 'Administrador' : 'Técnico' },
    first_name: role === 'ADMIN' ? 'Andrea' : 'Carlos',
    last_name: role === 'ADMIN' ? 'Villacís' : 'Mendoza',
    email: role === 'ADMIN' ? 'andrea@test.ec' : 'carlos@test.ec',
    last_login_at: null,
    technician_mode: technicianMode,
  }
}

// Renderiza con una sesión y un enrutador en memoria, sin backend.
export function withSession(user: SessionUser | null, children: ReactNode, initialPath = '/') {
  const value: AuthContextValue = {
    user,
    isLoading: false,
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    setTechnicianMode: vi.fn(),
  }
  return (
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    </AuthContext.Provider>
  )
}
