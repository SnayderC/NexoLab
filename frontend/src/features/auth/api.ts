import { ApiError, apiRequest } from '../../lib/apiClient'
import type { Role } from '../../types/catalog'
import type { User } from '../../types/user'

// Autenticación contra la API real de Django (fase 3): POST auth/login, POST auth/logout,
// GET auth/me y POST auth/change-password (sección 13).

// Usuario de la sesión, con su rol ya unido (lo que devuelve GET auth/me).
export type SessionUser = User & { role: Role }

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED'

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.code = code
  }
}

export class WrongCurrentPasswordError extends Error {}

// La nueva contraseña no cumple las reglas de RN-04; trae los mensajes del backend.
export class InvalidNewPasswordError extends Error {
  readonly messages: string[]

  constructor(messages: string[]) {
    super(messages.join(' '))
    this.messages = messages
  }
}

// Copia del usuario de la sesión para los módulos que aún usan datos de demostración
// (por ejemplo, "Registrada por" al registrar una incidencia). La actualizan las funciones de abajo.
let sessionUser: SessionUser | null = null

export function getSession(): SessionUser | null {
  return sessionUser
}

export async function login(email: string, password: string): Promise<SessionUser> {
  try {
    sessionUser = await apiRequest<SessionUser>('/auth/login', { method: 'POST', body: { email, password } })
    return sessionUser
  } catch (error) {
    // RN-01 y RN-02: el backend decide el mensaje; aquí solo se traduce a un código.
    if (error instanceof ApiError && error.data.code === 'account_disabled') throw new AuthError('ACCOUNT_DISABLED')
    if (error instanceof ApiError && error.status === 400) throw new AuthError('INVALID_CREDENTIALS')
    throw error
  }
}

export async function logout(): Promise<void> {
  sessionUser = null
  await apiRequest('/auth/logout', { method: 'POST' })
}

// Sesión abierta en el servidor (sobrevive a recargar la página). null si no hay sesión.
export async function fetchCurrentUser(): Promise<SessionUser | null> {
  try {
    sessionUser = await apiRequest<SessionUser>('/auth/me')
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) throw error
    sessionUser = null
  }
  return sessionUser
}

export async function changePassword(input: { current_password: string; new_password: string }): Promise<void> {
  try {
    await apiRequest('/auth/change-password', { method: 'POST', body: input })
  } catch (error) {
    if (error instanceof ApiError && error.data.current_password) throw new WrongCurrentPasswordError()
    if (error instanceof ApiError && Array.isArray(error.data.new_password)) {
      throw new InvalidNewPasswordError(error.data.new_password as string[])
    }
    throw error
  }
}
