import { ApiError, apiRequest } from '../../lib/apiClient'

// Usa la API real: GET/POST laboratories, PATCH laboratories/{id} y
// POST laboratories/{id}/activate|deactivate (sección 13).

export type LaboratoryListItem = {
  id: number
  code: string
  name: string
  location: string | null
  station_count: number
  responsible_technician_id: number | null
  responsible_name: string | null
  active_device_count: number
  // Composición por tipo, como "PC 10 · Monitor 10 · UPS 8".
  device_breakdown: string
  open_incident_count: number
  is_active: boolean
}

export type LaboratoryInput = {
  code: string
  name: string
  location: string | null
  station_count: number
  responsible_technician_id: number | null
  is_active: boolean
}

export class DuplicateLaboratoryCodeError extends Error {
  readonly code: string

  constructor(code: string) {
    super(`Ya existe un laboratorio con el código ${code}`)
    this.code = code
  }
}

export class LaboratoryHasOpenIncidentsError extends Error {
  readonly openIncidentCount: number

  constructor(openIncidentCount: number) {
    super('El laboratorio tiene incidencias abiertas')
    this.openIncidentCount = openIncidentCount
  }
}

type DeviceCount = { device_type_id: number; code: string; name: string; count: number }
type LaboratoryResponse = Omit<LaboratoryListItem, 'device_breakdown'> & { device_counts: DeviceCount[] }

// En la composición, "PC de escritorio" se muestra como "PC" (Figma 5.0).
function toListItem({ device_counts, ...laboratory }: LaboratoryResponse): LaboratoryListItem {
  return {
    ...laboratory,
    device_breakdown: device_counts
      .map((type) => `${type.code === 'PC' ? 'PC' : type.name} ${type.count}`)
      .join(' · '),
  }
}

// Convierte las respuestas de reglas de negocio en errores que entiende el formulario.
function toLaboratoryError(error: unknown, code: string): unknown {
  if (error instanceof ApiError) {
    if (error.status === 400 && Array.isArray(error.data.code)) {
      return new DuplicateLaboratoryCodeError(code.trim().toUpperCase())
    }
    if (error.status === 409 && error.data.code === 'has_open_incidents') {
      return new LaboratoryHasOpenIncidentsError(Number(error.data.open_incident_count))
    }
  }
  return error
}

export async function listLaboratories(): Promise<LaboratoryListItem[]> {
  const laboratories = await apiRequest<LaboratoryResponse[]>('/laboratories')
  return laboratories.map(toListItem)
}

export async function createLaboratory(input: LaboratoryInput): Promise<void> {
  try {
    await apiRequest('/laboratories', { method: 'POST', body: input })
  } catch (error) {
    throw toLaboratoryError(error, input.code)
  }
}

export async function updateLaboratory(id: number, input: LaboratoryInput): Promise<void> {
  try {
    await apiRequest(`/laboratories/${id}`, { method: 'PATCH', body: input })
  } catch (error) {
    throw toLaboratoryError(error, input.code)
  }
}

// RN-10: el backend no desactiva un laboratorio con incidencias abiertas (409).
export async function setLaboratoryActive(id: number, isActive: boolean): Promise<void> {
  try {
    await apiRequest(`/laboratories/${id}/${isActive ? 'activate' : 'deactivate'}`, { method: 'POST' })
  } catch (error) {
    throw toLaboratoryError(error, '')
  }
}

export type ResponsibleOption = { id: number; name: string }

type UserRow = { id: number; first_name: string; last_name: string; is_active: boolean; role: { code: string } }

// Técnicos activos que pueden ser responsables de un laboratorio (GET users, solo administrador).
export async function getResponsibleOptions(): Promise<ResponsibleOption[]> {
  const users = await apiRequest<UserRow[]>('/users')
  return users
    .filter((user) => user.role.code === 'TECHNICIAN' && user.is_active)
    .map((user) => ({ id: user.id, name: `${user.first_name} ${user.last_name}` }))
}
