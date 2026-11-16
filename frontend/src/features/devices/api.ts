import { ApiError, apiRequest } from '../../lib/apiClient'
import type { DeviceStatusCode, IncidentStatusCode, RiskLevel } from '../../types/catalog'
import type { Priority } from '../../types/incident'
import type { ClassificationMethod } from '../../types/risk'
import type { DeviceRiskItem } from './types'

// Usa la API real: GET devices, POST devices, PATCH devices/{id}, GET devices/{code},
// GET devices/{code}/incidents, GET device-types y GET laboratories (sección 13).
// El riesgo es el resultado vigente del modelo K-Means guardado en la base.

// ---------- Opciones de filtros y formularios ----------

export type LaboratoryOption = { id: number; code: string }
export type DeviceTypeOption = { id: number; code: string; name: string }

export type DeviceOptions = {
  laboratories: LaboratoryOption[]
  deviceTypes: DeviceTypeOption[]
}

// Laboratorios activos y tipos seleccionados en el catálogo (RN-07).
export async function getDeviceOptions(): Promise<DeviceOptions> {
  const [laboratories, deviceTypes] = await Promise.all([
    apiRequest<(LaboratoryOption & { is_active: boolean })[]>('/laboratories'),
    apiRequest<(DeviceTypeOption & { is_selected: boolean; is_active: boolean })[]>('/device-types'),
  ])
  return {
    laboratories: laboratories.filter((lab) => lab.is_active).map(({ id, code }) => ({ id, code })),
    deviceTypes: deviceTypes
      .filter((type) => type.is_selected && type.is_active)
      .map(({ id, code, name }) => ({ id, code, name })),
  }
}

// ---------- Historial del equipo (Figma 04 · Equipos) ----------

export const HISTORY_PAGE_SIZE = 10

export type DeviceHistory = {
  code: string
  type_name: string
  laboratory_code: string
  physical_location: string | null
  specifications: string | null
  status: DeviceStatusCode
  status_name: string
  // Solo si el equipo fue retirado al cerrar una incidencia (RN-19).
  retirement: { retired_at: string; incident_number: string | null; action_name: string | null } | null
  // Riesgo vigente; vacío si el equipo está retirado.
  current_risk:
    | (DeviceRiskItem & {
        risk_level_info: RiskLevel
        calculated_at: string
        // Perfil promedio del grupo (centroide); vacío si no hay historial suficiente.
        group_average: { incident_count: number; days_since_last_failure: number; failure_interval_days: number } | null
      })
    | null
  // Un punto por mes con el nivel de su último cálculo, del más antiguo al más reciente.
  risk_history: { month: string; risk_level: RiskLevel['code']; classification_method: ClassificationMethod }[]
}

export type DeviceIncidentItem = {
  id: number
  incident_number: string
  opened_at: string
  component_name: string
  priority: Priority
  status: IncidentStatusCode
  diagnosis: string | null
  resolution_action_name: string | null
  resolution_time_minutes: number | null
  technician_name: string | null
}

export type DeviceIncidentPage = {
  items: DeviceIncidentItem[]
  total: number
  now: string
}

export class DeviceNotFoundError extends Error {
  constructor(code: string) {
    super(`Equipo ${code} no encontrado`)
  }
}

type CentroidProfile = {
  avg_incident_count: number
  avg_days_since_last_failure: number
  avg_failure_interval_days: number
}

type DeviceHistoryResponse = Omit<DeviceHistory, 'current_risk'> & {
  current_risk: (Omit<NonNullable<DeviceHistory['current_risk']>, 'group_average'> & {
    group_average: CentroidProfile | null
  }) | null
}

async function requestDevice<T>(code: string, path: string): Promise<T> {
  try {
    return await apiRequest<T>(path)
  } catch (error) {
    throw error instanceof ApiError && error.status === 404 ? new DeviceNotFoundError(code) : error
  }
}

export async function getDeviceHistory(code: string): Promise<DeviceHistory> {
  const history = await requestDevice<DeviceHistoryResponse>(code, `/devices/${encodeURIComponent(code)}`)
  const risk = history.current_risk
  return {
    ...history,
    current_risk: risk && {
      ...risk,
      group_average: risk.group_average && {
        incident_count: risk.group_average.avg_incident_count,
        days_since_last_failure: risk.group_average.avg_days_since_last_failure,
        failure_interval_days: risk.group_average.avg_failure_interval_days,
      },
    },
  }
}

export function getDeviceIncidents(code: string, page: number): Promise<DeviceIncidentPage> {
  return requestDevice<DeviceIncidentPage>(code, `/devices/${encodeURIComponent(code)}/incidents?page=${page}`)
}

// ---------- Administración de equipos (Figma 5.4 a 5.8) ----------

export const DEVICE_PAGE_SIZE = 10

export type DeviceStatusFilter = DeviceStatusCode | 'ALL'

export type DeviceListFilters = {
  search: string
  laboratory_id: number | null
  device_type_id: number | null
  status: DeviceStatusFilter
  risk_level: RiskLevel['code'] | null
  page: number
}

export type DeviceListItem = {
  id: number
  code: string
  laboratory_id: number
  laboratory_code: string
  device_type_id: number
  type_name: string
  physical_location: string | null
  specifications: string | null
  status: DeviceStatusCode
  // Vacío para equipos retirados ("No aplica").
  risk_level: RiskLevel['code'] | null
  incident_count: number
}

export type DeviceInput = {
  code: string
  laboratory_id: number
  device_type_id: number
  physical_location: string | null
  specifications: string | null
}

// El backend rechazó el código: formato inválido (RN-11), prefijo distinto (D-21) o duplicado.
export class DeviceCodeError extends Error {}

// RN-11 (D-43): formato LAB-TIPO-NN con cualquier código de laboratorio (H103-PC-13, H106A-PC-05)
// y un número de 2 o 3 cifras. El backend aplica la misma regla.
export const DEVICE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,9}-[A-Z]{2,5}-\d{2,3}$/

export function listDevices(filters: DeviceListFilters): Promise<{ items: DeviceListItem[]; total: number }> {
  const params = new URLSearchParams({ page: String(filters.page), status: filters.status })
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.laboratory_id !== null) params.set('laboratory_id', String(filters.laboratory_id))
  if (filters.device_type_id !== null) params.set('device_type_id', String(filters.device_type_id))
  if (filters.risk_level !== null) params.set('risk_level', filters.risk_level)
  return apiRequest(`/devices?${params}`)
}

function toDeviceError(error: unknown): unknown {
  if (error instanceof ApiError && error.status === 400 && Array.isArray(error.data.code)) {
    return new DeviceCodeError(String(error.data.code[0]))
  }
  return error
}

// RN-23: un equipo nuevo entra en riesgo bajo hasta que tenga historial.
export async function createDevice(input: DeviceInput): Promise<void> {
  try {
    await apiRequest('/devices', { method: 'POST', body: input })
  } catch (error) {
    throw toDeviceError(error)
  }
}

// D-20: el código, el laboratorio y el tipo no se editan. Pasar a RETIRED retira el equipo (RN-12).
export async function updateDevice(
  id: number,
  input: { physical_location: string | null; specifications: string | null; status: DeviceStatusCode },
): Promise<void> {
  await apiRequest(`/devices/${id}`, { method: 'PATCH', body: input })
}

// El equipo tiene incidencias: no se anula, se retira (RN-26).
export class DeviceHasIncidentsError extends Error {}

// RN-26 (D-56): anula un equipo registrado por error (solo administrador y sin incidencias).
export async function voidDevice(id: number): Promise<void> {
  try {
    await apiRequest(`/devices/${id}/void`, { method: 'POST' })
  } catch (error) {
    if (error instanceof ApiError && error.data.code === 'has_incidents') throw new DeviceHasIncidentsError(error.message)
    throw error
  }
}
