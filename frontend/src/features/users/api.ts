import { roles } from '../../mocks/catalogs'
import { DEMO_NOW } from '../../mocks/demoClock'
import { laboratories } from '../../mocks/laboratories'
import { users, userWorkload } from '../../mocks/users'
import type { RoleCode } from '../../types/catalog'

// Por ahora trabaja sobre mocks/ (en memoria). En la fase 7 llamará a la API de usuarios.
// Las contraseñas nunca se guardan en el frontend: en la demostración solo se validan.

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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listUsers(): Promise<UserListItem[]> {
  await wait(400)
  return users.map((user) => {
    const role = roles.find((r) => r.id === user.role_id)!
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_id: user.role_id,
      role_code: role.code,
      role_name: role.name,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      laboratory_codes: laboratories
        .filter((lab) => lab.responsible_technician_id === user.id && lab.is_active)
        .map((lab) => lab.code),
      registered_count: userWorkload[user.id]?.registered ?? 0,
      closed_count: userWorkload[user.id]?.closed ?? 0,
    }
  })
}

function assertUniqueEmail(email: string, exceptId: number | null) {
  const normalized = email.trim().toLowerCase()
  if (users.some((u) => u.email.toLowerCase() === normalized && u.id !== exceptId)) {
    throw new DuplicateEmailError()
  }
}

// La contraseña temporal la recibe el backend (RN-03); aquí no se guarda.
export async function createUser(input: UserInput & { temporary_password: string }): Promise<void> {
  await wait(600)
  assertUniqueEmail(input.email, null)
  users.push({
    id: Math.max(...users.map((u) => u.id)) + 1,
    is_active: true,
    created_at: DEMO_NOW,
    updated_at: DEMO_NOW,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    email: input.email.trim().toLowerCase(),
    role_id: input.role_id,
    last_login_at: null,
  })
}

export async function updateUser(id: number, input: UserInput): Promise<void> {
  await wait(600)
  assertUniqueEmail(input.email, id)
  const user = users.find((u) => u.id === id)!
  Object.assign(user, { ...input, email: input.email.trim().toLowerCase(), updated_at: DEMO_NOW })
}

// RN-05: un usuario no puede desactivarse a sí mismo.
export async function setUserActive(id: number, isActive: boolean, currentUserId: number): Promise<void> {
  await wait(600)
  if (!isActive && id === currentUserId) throw new SelfDeactivationError()
  const user = users.find((u) => u.id === id)!
  user.is_active = isActive
  user.updated_at = DEMO_NOW
}

// RN-03: el administrador restablece la contraseña; el backend la guardará con hash.
export async function resetUserPassword(input: { id: number; new_password: string }): Promise<void> {
  await wait(600)
  if (!users.some((u) => u.id === input.id)) throw new Error(`Usuario ${input.id} no encontrado`)
}

export function getRoleOptions() {
  return roles.map((role) => ({ value: String(role.id), label: role.name }))
}
