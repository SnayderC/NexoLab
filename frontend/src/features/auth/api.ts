import { ApiError, apiRequest } from '../../lib/apiClient'
import type { Role } from '../../types/catalog'
import type { User } from '../../types/user'

// Autenticación contra la API real de Django (fase 3): POST auth/login, POST auth/logout,
// GET auth/me y POST auth/change-password (sección 13).

// Usuario de la sesión, con su rol ya unido (lo que devuelve GET auth/me).
// technician_mode no es columna de la BD: vive en la sesión del servidor (RN-24, D-45).
export type SessionUser = User & { role: Role; technician_mode: boolean }

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' | 'TOO_MANY_ATTEMPTS'

export class AuthError extends Error {
  readonly code: AuthErrorCode

  // message: el texto del backend cuando trae datos propios (los minutos de bloqueo de RN-25).
  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code)
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

export async function login(email: string, password: string): Promise<SessionUser> {
  try {
    return await apiRequest<SessionUser>('/auth/login', { method: 'POST', body: { email, password } })
  } catch (error) {
    // RN-01, RN-02 y RN-25: el backend decide el mensaje; aquí solo se traduce a un código.
    if (error instanceof ApiError && error.status === 429) throw new AuthError('TOO_MANY_ATTEMPTS', error.message)
    if (error instanceof ApiError && error.data.code === 'account_disabled') throw new AuthError('ACCOUNT_DISABLED')
    if (error instanceof ApiError && error.status === 400) throw new AuthError('INVALID_CREDENTIALS')
    throw error
  }
}

export async function logout(): Promise<void> {
  await apiRequest('/auth/logout', { method: 'POST' })
}

// Sesión abierta en el servidor (sobrevive a recargar la página). null si no hay sesión.
export async function fetchCurrentUser(): Promise<SessionUser | null> {
  try {
    return await apiRequest<SessionUser>('/auth/me')
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) throw error
    return null
  }
}

// Solo administrador: activa o desactiva el modo técnico de esta sesión (RN-24).
export async function setTechnicianMode(enabled: boolean): Promise<SessionUser> {
  return apiRequest<SessionUser>('/auth/technician-mode', { method: 'POST', body: { enabled } })
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
