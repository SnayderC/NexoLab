import { ApiError, apiRequest } from '../../lib/apiClient'
import type { DeviceStatusCode, IncidentStatusCode } from '../../types/catalog'
import type { Priority } from '../../types/incident'
import { getDeviceHistory, getDeviceIncidents } from '../devices/api'
import type { DeviceRiskItem } from '../devices/types'

// Usa la API real: GET/POST incidents, GET incidents/{número}, POST incidents/{número}/close
// y GET devices/eligible (sección 13). El backend pone el número (RN-14) y el usuario de la sesión (RN-15),
// y al cerrar recalcula el riesgo (disparador INCIDENT_CLOSED).

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
  // Hora del servidor: referencia para "hace 2 h 15 min".
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

// El backend rechazó los datos; el mensaje explica por qué (por ejemplo, RN-13 o RN-21).
export class IncidentRequestError extends Error {}

// Primer mensaje de una respuesta de error: { detail } o { campo: ['mensaje'] }.
function toIncidentError(error: unknown): unknown {
  if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 409)) return error
  if (typeof error.data.detail === 'string') return new IncidentRequestError(error.data.detail)
  const first = Object.values(error.data).find(Array.isArray)
  return first ? new IncidentRequestError(String(first[0])) : error
}

async function send<T>(path: string, body: unknown): Promise<T> {
  try {
    return await apiRequest<T>(path, { method: 'POST', body })
  } catch (error) {
    throw toIncidentError(error)
  }
}

export function listIncidents(filters: IncidentListFilters): Promise<IncidentListResult> {
  const params = new URLSearchParams({ status: filters.status, page: String(filters.page) })
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.laboratory_id !== null) params.set('laboratory_id', String(filters.laboratory_id))
  if (filters.priority !== null) params.set('priority', filters.priority)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  return apiRequest(`/incidents?${params}`)
}

export function getIncident(incidentNumber: string): Promise<IncidentDetail> {
  return apiRequest(`/incidents/${encodeURIComponent(incidentNumber)}`)
}

// Devuelve el número de la nueva incidencia (RN-14: lo genera el sistema).
export async function createIncident(input: CreateIncidentInput): Promise<string> {
  const incident = await send<IncidentDetail>('/incidents', input)
  return incident.incident_number
}

// Cierra la incidencia. Si la acción retira el equipo (RN-19), el backend lo pasa a Retirado
// en la misma operación. Devuelve el código del equipo retirado, si hubo uno.
export async function closeIncident(
  incidentNumber: string,
  input: CloseIncidentInput,
): Promise<{ retired_device_code: string | null }> {
  return send(`/incidents/${encodeURIComponent(incidentNumber)}/close`, input)
}

// RN-22: anular una incidencia registrada por error (solo administrador). Deja de contar en el riesgo
// y en los indicadores, y el backend recalcula el riesgo.
export async function voidIncident(incidentNumber: string): Promise<void> {
  await send(`/incidents/${encodeURIComponent(incidentNumber)}/void`, undefined)
}

// ---------- Equipos del formulario de registro (RN-13) ----------

export type EligibleDevice = { id: number; code: string; laboratory_id: number; label: string }

// Equipos que admiten incidencias: activos, de un laboratorio activo y de un tipo seleccionado.
export function listEligibleDevices(laboratoryId: number): Promise<EligibleDevice[]> {
  return apiRequest(`/devices/eligible?laboratory_id=${laboratoryId}`)
}

// Equipo ya elegido al venir de "Registrar incidencia para este equipo". Vacío si no admite incidencias.
export async function findRegistrationDevice(code: string): Promise<EligibleDevice | null> {
  const devices = await apiRequest<EligibleDevice[]>(`/devices/eligible?code=${encodeURIComponent(code)}`)
  return devices[0] ?? null
}

// ---------- Panel "Información del equipo" del registro (Figma 3.4 y 3.5) ----------

export type RecentIncident = {
  incident_number: string
  status: IncidentStatusCode
  component_name: string
  opened_at: string
}

export type DeviceInfo = {
  code: string
  laboratory_code: string
  physical_location: string | null
  specifications: string | null
  status: DeviceStatusCode
  status_name: string
  // Vacío si el equipo no tiene un resultado de riesgo vigente (por ejemplo, retirado).
  risk: DeviceRiskItem | null
  recent_incidents: RecentIncident[]
}

const RECENT_INCIDENT_COUNT = 3

export async function getDeviceInfo(code: string): Promise<DeviceInfo> {
  const [history, incidents] = await Promise.all([getDeviceHistory(code), getDeviceIncidents(code, 1)])
  return {
    code: history.code,
    laboratory_code: history.laboratory_code,
    physical_location: history.physical_location,
    specifications: history.specifications,
    status: history.status,
    status_name: history.status_name,
    risk: history.current_risk,
    recent_incidents: incidents.items.slice(0, RECENT_INCIDENT_COUNT).map((incident) => ({
      incident_number: incident.incident_number,
      status: incident.status,
      component_name: incident.component_name,
      opened_at: incident.opened_at,
    })),
  }
}
