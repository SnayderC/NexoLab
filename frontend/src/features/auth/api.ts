import { roles } from '../../mocks/catalogs'
import { users } from '../../mocks/users'
import type { Role } from '../../types/catalog'
import type { User } from '../../types/user'

// Por ahora simula el backend con mocks/. En la fase 7 llamará a
// POST auth/login, POST auth/logout y GET auth/me (sección 13).

// Usuario de la sesión, con su rol ya unido (lo que devolverá GET auth/me).
export type SessionUser = User & { role: Role }

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED'

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.code = code
  }
}

const SESSION_KEY = 'nexolab.session_user_id'
const DEMO_DELAY_MS = 600

function toSessionUser(user: User): SessionUser {
  const role = roles.find((r) => r.id === user.role_id)
  if (!role) throw new Error(`Rol ${user.role_id} no encontrado`)
  return { ...user, role }
}

export async function login(email: string, password: string): Promise<SessionUser> {
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS))

  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD

  // RN-01: el mismo error si el correo no existe o la contraseña no coincide.
  if (!user || !demoPassword || password !== demoPassword) {
    throw new AuthError('INVALID_CREDENTIALS')
  }
  // RN-02: se revisa después de la contraseña para no revelar qué correos existen.
  if (!user.is_active) throw new AuthError('ACCOUNT_DISABLED')

  try {
    localStorage.setItem(SESSION_KEY, String(user.id))
  } catch {
    // Sin acceso al almacenamiento, la sesión dura hasta recargar la página.
  }
  return toSessionUser(user)
}

export function logout(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Nada que borrar.
  }
}

// Sesión guardada en el navegador (sobrevive a recargar la página).
export function getSession(): SessionUser | null {
  try {
    const id = Number(localStorage.getItem(SESSION_KEY))
    const user = users.find((u) => u.id === id && u.is_active)
    return user ? toSessionUser(user) : null
  } catch {
    return null
  }
}
