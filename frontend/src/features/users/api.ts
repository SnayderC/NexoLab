import { ApiError, apiRequest } from '../../lib/apiClient'
import type { Role, RoleCode } from '../../types/catalog'

// Usa la API real: GET/POST users, PATCH users/{id}, POST users/{id}/activate|deactivate
// y POST users/{id}/reset-password (sección 13). Las contraseñas solo viajan al backend,
// que las guarda con hash.

export type UserListItem = {
  id: number
  first_name: string
  last_name: string
  email: string
  role_id: number
  role_code: RoleCode
  role_name: string
  is_active: boolean
  last_login_at: string | null
  laboratory_codes: string[]
  registered_count: number
  closed_count: number
}

export type UserInput = {
  first_name: string
  last_name: string
  email: string
  role_id: number
}

export class DuplicateEmailError extends Error {
  constructor() {
    super('Ya existe un usuario con este correo')
  }
}

export class SelfDeactivationError extends Error {}

// RN-04: el backend rechazó la contraseña con los validadores de Django.
export class InvalidUserPasswordError extends Error {
  readonly messages: string[]

  constructor(messages: string[]) {
    super(messages.join(' '))
    this.messages = messages
  }
}

type UserResponse = Omit<UserListItem, 'role_code' | 'role_name'> & { role: Pick<Role, 'id' | 'code' | 'name'> }

function toListItem({ role, ...user }: UserResponse): UserListItem {
  return { ...user, role_code: role.code, role_name: role.name }
}

// Convierte las respuestas de reglas de negocio en errores que entienden los formularios.
function toUserError(error: unknown): unknown {
  if (error instanceof ApiError) {
    const passwordMessages = error.data.temporary_password ?? error.data.new_password
    if (error.status === 400 && Array.isArray(error.data.email)) return new DuplicateEmailError()
    if (error.status === 400 && Array.isArray(passwordMessages)) {
      return new InvalidUserPasswordError(passwordMessages.map(String))
    }
    if (error.status === 409 && error.data.code === 'self_deactivation') return new SelfDeactivationError()
  }
  return error
}

async function request(path: string, method: string, body?: unknown): Promise<void> {
  try {
    await apiRequest(path, { method, body })
  } catch (error) {
    throw toUserError(error)
  }
}

export async function listUsers(): Promise<UserListItem[]> {
  const users = await apiRequest<UserResponse[]>('/users')
  return users.map(toListItem)
}

// RN-03: el administrador crea el usuario con una contraseña temporal.
export function createUser(input: UserInput & { temporary_password: string }): Promise<void> {
  return request('/users', 'POST', input)
}

export function updateUser(id: number, input: UserInput): Promise<void> {
  return request(`/users/${id}`, 'PATCH', input)
}

// RN-05: el backend no permite desactivar la propia cuenta (409).
export function setUserActive(id: number, isActive: boolean): Promise<void> {
  return request(`/users/${id}/${isActive ? 'activate' : 'deactivate'}`, 'POST')
}

// RN-03: el administrador restablece la contraseña.
export function resetUserPassword(input: { id: number; new_password: string }): Promise<void> {
  return request(`/users/${input.id}/reset-password`, 'POST', { new_password: input.new_password })
}
