import { deviceStatuses, deviceTypes, incidentStatuses, roles } from '../../mocks/catalogs'
import { DEMO_NOW } from '../../mocks/demoClock'
import { devices } from '../../mocks/devices'
import { incidents } from '../../mocks/incidents'
import { laboratories } from '../../mocks/laboratories'
import { users } from '../../mocks/users'

// Por ahora trabaja sobre mocks/ (en memoria: al recargar la página vuelve al estado inicial).
// En la fase 7 llamará a GET/POST laboratories, PATCH laboratories/{id} y
// POST laboratories/{id}/deactivate (sección 13).

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

const DEMO_DELAY_MS = 400
const SAVE_DELAY_MS = 600

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// En la composición, "PC de escritorio" se muestra como "PC" (Figma 5.0).
const shortTypeName = (typeId: number) => {
  const type = deviceTypes.find((t) => t.id === typeId)!
  return type.code === 'PC' ? 'PC' : type.name
}

function openIncidentCount(laboratoryId: number): number {
  const openStatusId = incidentStatuses.find((s) => s.code === 'OPEN')!.id
  return incidents.filter((incident) => {
    const device = devices.find((d) => d.id === incident.device_id)!
    return incident.is_active && incident.incident_status_id === openStatusId && device.laboratory_id === laboratoryId
  }).length
}

function toListItem(laboratory: (typeof laboratories)[number]): LaboratoryListItem {
  const activeStatusId = deviceStatuses.find((s) => s.code === 'ACTIVE')!.id
  const activeDevices = devices.filter(
    (d) => d.laboratory_id === laboratory.id && d.is_active && d.device_status_id === activeStatusId,
  )
  // Cantidad por tipo, en el orden del catálogo.
  const countByType = new Map<number, number>()
  activeDevices
    .sort((a, b) => a.device_type_id - b.device_type_id)
    .forEach((d) => countByType.set(d.device_type_id, (countByType.get(d.device_type_id) ?? 0) + 1))
  const responsible = users.find((u) => u.id === laboratory.responsible_technician_id)

  return {
    id: laboratory.id,
    code: laboratory.code,
    name: laboratory.name,
    location: laboratory.location,
    station_count: laboratory.station_count,
    responsible_technician_id: laboratory.responsible_technician_id,
    responsible_name: responsible ? `${responsible.first_name} ${responsible.last_name}` : null,
    active_device_count: activeDevices.length,
    device_breakdown: [...countByType.entries()]
      .map(([typeId, count]) => `${shortTypeName(typeId)} ${count}`)
      .join(' · '),
    open_incident_count: openIncidentCount(laboratory.id),
    is_active: laboratory.is_active,
  }
}

function assertUniqueCode(code: string, exceptId: number | null) {
  const normalized = code.trim().toUpperCase()
  if (laboratories.some((lab) => lab.code.toUpperCase() === normalized && lab.id !== exceptId)) {
    throw new DuplicateLaboratoryCodeError(normalized)
  }
}

export async function listLaboratories(): Promise<LaboratoryListItem[]> {
  await wait(DEMO_DELAY_MS)
  return laboratories.map(toListItem)
}

export async function createLaboratory(input: LaboratoryInput): Promise<void> {
  await wait(SAVE_DELAY_MS)
  assertUniqueCode(input.code, null)

  laboratories.push({
    id: Math.max(...laboratories.map((lab) => lab.id)) + 1,
    created_at: DEMO_NOW,
    updated_at: DEMO_NOW,
    ...input,
    code: input.code.trim().toUpperCase(),
  })
}

export async function updateLaboratory(id: number, input: LaboratoryInput): Promise<void> {
  await wait(SAVE_DELAY_MS)
  assertUniqueCode(input.code, id)

  const laboratory = laboratories.find((lab) => lab.id === id)!
  // RN-10: tampoco se desactiva desde el formulario si tiene incidencias abiertas.
  if (laboratory.is_active && !input.is_active) {
    const count = openIncidentCount(id)
    if (count > 0) throw new LaboratoryHasOpenIncidentsError(count)
  }
  Object.assign(laboratory, { ...input, code: input.code.trim().toUpperCase(), updated_at: DEMO_NOW })
}

// RN-10: no se puede desactivar un laboratorio con incidencias abiertas.
export async function setLaboratoryActive(id: number, isActive: boolean): Promise<void> {
  await wait(SAVE_DELAY_MS)

  const laboratory = laboratories.find((lab) => lab.id === id)!
  if (!isActive) {
    const count = openIncidentCount(id)
    if (count > 0) throw new LaboratoryHasOpenIncidentsError(count)
  }
  laboratory.is_active = isActive
  laboratory.updated_at = DEMO_NOW
}

// Técnicos activos que pueden ser responsables de un laboratorio.
export function getResponsibleOptions() {
  const technicianRoleId = roles.find((role) => role.code === 'TECHNICIAN')!.id
  return users
    .filter((user) => user.role_id === technicianRoleId && user.is_active)
    .map((user) => ({ id: user.id, name: `${user.first_name} ${user.last_name}` }))
}
