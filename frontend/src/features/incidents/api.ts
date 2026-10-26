import { components, deviceStatuses, deviceTypes, incidentStatuses, resolutionActions } from '../../mocks/catalogs'
import { DEMO_NOW } from '../../mocks/demoClock'
import { devices } from '../../mocks/devices'
import { incidents } from '../../mocks/incidents'
import { laboratories } from '../../mocks/laboratories'
import { deviceRiskResults } from '../../mocks/risk'
import { users } from '../../mocks/users'
import { toDateInputValue } from '../../lib/formatDate'
import type { IncidentStatusCode } from '../../types/catalog'
import type { Incident, Priority } from '../../types/incident'
import { getSession } from '../auth/api'

// Por ahora trabaja sobre mocks/ (en memoria: al recargar la página vuelve al estado inicial).
// En la fase 7 llamará a GET/POST incidents y POST incidents/{id}/close (sección 13).

export const PAGE_SIZE = 10

export type IncidentStatusFilter = IncidentStatusCode | 'ALL'

export type IncidentListFilters = {
  status: IncidentStatusFilter
  // N.º de incidencia o código de equipo.
  search: string
  laboratory_id: number | null
  priority: Priority | null
  // Fechas de la falla en formato aaaa-mm-dd (hora de Ecuador).
  from: string | null
  to: string | null
  page: number
}

export type IncidentListItem = {
  id: number
  incident_number: string
  device_code: string
  laboratory_code: string
  component_name: string
  priority: Priority
  status: IncidentStatusCode
  opened_at: string
  resolution_time_minutes: number | null
  reported_by_name: string
  closed_by_name: string | null
  resolution_action_name: string | null
}

export type IncidentListResult = {
  items: IncidentListItem[]
  total: number
  // Cantidad por pestaña (sin los demás filtros).
  counts: Record<IncidentStatusFilter, number>
  // Referencia para "hace 2 h 15 min".
  now: string
}

export type IncidentDetail = IncidentListItem & {
  device_id: number
  description: string
  diagnosis: string | null
  notes: string | null
  closed_at: string | null
}

export type CreateIncidentInput = {
  device_id: number
  component_id: number
  priority: Priority
  opened_at: string
  description: string
}

export type CloseIncidentInput = {
  resolution_action_id: number
  diagnosis: string
  notes: string | null
  closed_at: string
}

const DEMO_DELAY_MS = 400
const SAVE_DELAY_MS = 600

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const statusId = (code: IncidentStatusCode) => incidentStatuses.find((s) => s.code === code)!.id
const statusCode = (id: number) => incidentStatuses.find((s) => s.id === id)!.code

function userName(id: number | null): string | null {
  const user = users.find((u) => u.id === id)
  return user ? `${user.first_name} ${user.last_name}` : null
}

function toListItem(incident: Incident): IncidentListItem {
  const device = devices.find((d) => d.id === incident.device_id)!
  return {
    id: incident.id,
    incident_number: incident.incident_number,
    device_code: device.code,
    laboratory_code: laboratories.find((lab) => lab.id === device.laboratory_id)!.code,
    component_name: components.find((c) => c.id === incident.component_id)!.name,
    priority: incident.priority,
    status: statusCode(incident.incident_status_id),
    opened_at: incident.opened_at,
    resolution_time_minutes: incident.resolution_time_minutes,
    reported_by_name: userName(incident.reported_by_id)!,
    closed_by_name: userName(incident.closed_by_id),
    resolution_action_name:
      resolutionActions.find((action) => action.id === incident.resolution_action_id)?.name ?? null,
  }
}

function findIncident(incidentNumber: string): Incident {
  const incident = incidents.find((i) => i.incident_number === incidentNumber && i.is_active)
  if (!incident) throw new Error(`Incidencia ${incidentNumber} no encontrada`)
  return incident
}

function requireSessionUserId(): number {
  // RN-15: quien registra o cierra es siempre el usuario de la sesión, nunca un dato del formulario.
  const session = getSession()
  if (!session) throw new Error('Sesión no iniciada')
  return session.id
}

export async function listIncidents(filters: IncidentListFilters): Promise<IncidentListResult> {
  await wait(DEMO_DELAY_MS)

  const valid = incidents.filter((incident) => incident.is_active)
  const search = filters.search.trim().toLowerCase()

  const filtered = valid
    .filter((incident) => filters.status === 'ALL' || incident.incident_status_id === statusId(filters.status))
    .map(toListItem)
    .filter((item) => {
      const device = devices.find((d) => d.code === item.device_code)!
      const openedDate = toDateInputValue(item.opened_at)
      return (
        (!search ||
          item.incident_number.toLowerCase().includes(search) ||
          item.device_code.toLowerCase().includes(search)) &&
        (filters.laboratory_id === null || device.laboratory_id === filters.laboratory_id) &&
        (filters.priority === null || item.priority === filters.priority) &&
        (filters.from === null || openedDate >= filters.from) &&
        (filters.to === null || openedDate <= filters.to)
      )
    })
    .sort((a, b) => b.opened_at.localeCompare(a.opened_at))

  const start = (filters.page - 1) * PAGE_SIZE

  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
    counts: {
      OPEN: valid.filter((i) => i.incident_status_id === statusId('OPEN')).length,
      CLOSED: valid.filter((i) => i.incident_status_id === statusId('CLOSED')).length,
      ALL: valid.length,
    },
    now: DEMO_NOW,
  }
}

export async function getIncident(incidentNumber: string): Promise<IncidentDetail> {
  await wait(DEMO_DELAY_MS)

  const incident = findIncident(incidentNumber)
  return {
    ...toListItem(incident),
    device_id: incident.device_id,
    description: incident.description,
    diagnosis: incident.diagnosis,
    notes: incident.notes,
    closed_at: incident.closed_at,
  }
}

// Devuelve el número de la nueva incidencia (RN-14: lo genera el sistema).
export async function createIncident(input: CreateIncidentInput): Promise<string> {
  await wait(SAVE_DELAY_MS)

  const id = Math.max(...incidents.map((incident) => incident.id)) + 1
  const incidentNumber = `INC-2026-${String(id).padStart(4, '0')}`

  incidents.push({
    id,
    is_active: true,
    created_at: DEMO_NOW,
    updated_at: DEMO_NOW,
    incident_number: incidentNumber,
    device_id: input.device_id,
    component_id: input.component_id,
    incident_status_id: statusId('OPEN'),
    resolution_action_id: null,
    reported_by_id: requireSessionUserId(),
    closed_by_id: null,
    priority: input.priority,
    description: input.description,
    diagnosis: null,
    notes: null,
    opened_at: input.opened_at,
    closed_at: null,
    resolution_time_minutes: null,
  })

  return incidentNumber
}

// Cierra la incidencia. Si la acción retira el equipo (RN-19), lo pasa a Retirado
// y deja de contar en el riesgo. Devuelve el código del equipo retirado, si hubo uno.
export async function closeIncident(
  incidentNumber: string,
  input: CloseIncidentInput,
): Promise<{ retired_device_code: string | null }> {
  await wait(SAVE_DELAY_MS)

  const incident = findIncident(incidentNumber)
  const action = resolutionActions.find((a) => a.id === input.resolution_action_id)!

  Object.assign(incident, {
    incident_status_id: statusId('CLOSED'),
    resolution_action_id: action.id,
    closed_by_id: requireSessionUserId(),
    diagnosis: input.diagnosis,
    notes: input.notes,
    closed_at: input.closed_at,
    // RN-18: closed_at − opened_at, en minutos.
    resolution_time_minutes: Math.round(
      (new Date(input.closed_at).getTime() - new Date(incident.opened_at).getTime()) / 60_000,
    ),
    updated_at: DEMO_NOW,
  })

  if (!action.is_retirement_action) return { retired_device_code: null }

  const device = devices.find((d) => d.id === incident.device_id)!
  device.device_status_id = deviceStatuses.find((s) => s.code === 'RETIRED')!.id
  device.retired_at = input.closed_at
  deviceRiskResults
    .filter((result) => result.device_id === device.id)
    .forEach((result) => (result.is_current = false))

  return { retired_device_code: device.code }
}

// Laboratorio y equipo para abrir el formulario de registro con un equipo ya elegido
// (botón "Registrar incidencia para este equipo"). Vacío si el equipo no admite incidencias.
export function findRegistrationDevice(code: string): { laboratory_id: number; device_id: number } | null {
  const device = devices.find((d) => d.code === code)
  if (!device) return null
  const isEligible = getRegistrationOptions()
    .devicesByLaboratory(device.laboratory_id)
    .some((option) => option.id === device.id)
  return isEligible ? { laboratory_id: device.laboratory_id, device_id: device.id } : null
}

// Opciones del formulario de registro. RN-13: solo equipos activos, de laboratorios activos
// y de tipos seleccionados en el catálogo.
export function getRegistrationOptions() {
  const activeStatusId = deviceStatuses.find((s) => s.code === 'ACTIVE')!.id

  return {
    laboratories: laboratories.filter((lab) => lab.is_active),
    components: components.filter((component) => component.is_active),
    resolutionActions: resolutionActions.filter((action) => action.is_active),
    devicesByLaboratory(laboratoryId: number) {
      return devices
        .filter((device) => {
          const type = deviceTypes.find((t) => t.id === device.device_type_id)!
          return (
            device.laboratory_id === laboratoryId &&
            device.is_active &&
            device.device_status_id === activeStatusId &&
            type.is_selected
          )
        })
        .map((device) => ({
          id: device.id,
          label: [
            device.code,
            deviceTypes.find((t) => t.id === device.device_type_id)!.name,
            device.physical_location,
          ]
            .filter(Boolean)
            .join(' · '),
        }))
    },
  }
}
