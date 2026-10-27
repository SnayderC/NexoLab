import {
  components,
  deviceStatuses,
  deviceTypes,
  incidentStatuses,
  resolutionActions,
  riskLevels,
} from '../../mocks/catalogs'
import { DEMO_NOW } from '../../mocks/demoClock'
import { devices } from '../../mocks/devices'
import { incidents } from '../../mocks/incidents'
import { laboratories } from '../../mocks/laboratories'
import { deviceRiskResults, kmeansCentroids } from '../../mocks/risk'
import { users } from '../../mocks/users'
import type { DeviceStatusCode, IncidentStatusCode, RiskLevel } from '../../types/catalog'
import type { Priority } from '../../types/incident'
import type { ClassificationMethod } from '../../types/risk'
import type { DeviceRiskItem } from './types'

// Por ahora arma con mocks/ lo que devolverán GET devices/{code}, GET devices/{code}/incidents
// y GET devices/{code}/risk-history (sección 13).

export type RecentIncident = {
  incident_number: string
  status: IncidentStatusCode
  component_name: string
  opened_at: string
}

export type DeviceInfo = {
  id: number
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

const DEMO_DELAY_MS = 300
const SAVE_DELAY_MS = 600
const RECENT_INCIDENT_COUNT = 3

// Riesgo vigente de un equipo, con los datos que muestran las tarjetas.
export function getDeviceRiskItem(deviceId: number): DeviceRiskItem | null {
  const result = deviceRiskResults.find((r) => r.device_id === deviceId && r.is_current)
  if (!result) return null

  const device = devices.find((d) => d.id === deviceId)!
  return {
    device_code: device.code,
    laboratory_code: laboratories.find((lab) => lab.id === device.laboratory_id)!.code,
    device_type_name: deviceTypes.find((type) => type.id === device.device_type_id)!.name,
    risk_level: riskLevels.find((level) => level.id === result.risk_level_id)!.code,
    classification_method: result.classification_method,
    incident_count: result.incident_count,
    days_since_last_failure: result.days_since_last_failure,
    avg_failure_interval_days: result.avg_failure_interval_days,
  }
}

export async function getDeviceInfo(deviceId: number): Promise<DeviceInfo> {
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS))

  const device = devices.find((d) => d.id === deviceId)
  if (!device) throw new Error(`Equipo ${deviceId} no encontrado`)
  const status = deviceStatuses.find((s) => s.id === device.device_status_id)!

  return {
    id: device.id,
    code: device.code,
    laboratory_code: laboratories.find((lab) => lab.id === device.laboratory_id)!.code,
    physical_location: device.physical_location,
    specifications: device.specifications,
    status: status.code,
    status_name: status.name,
    risk: getDeviceRiskItem(device.id),
    recent_incidents: incidents
      .filter((incident) => incident.device_id === device.id && incident.is_active)
      .sort((a, b) => b.opened_at.localeCompare(a.opened_at))
      .slice(0, RECENT_INCIDENT_COUNT)
      .map((incident) => ({
        incident_number: incident.incident_number,
        status: incidentStatuses.find((s) => s.id === incident.incident_status_id)!.code,
        component_name: components.find((c) => c.id === incident.component_id)!.name,
        opened_at: incident.opened_at,
      })),
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function findDevice(code: string) {
  const device = devices.find((d) => d.code === code && d.is_active)
  if (!device) throw new DeviceNotFoundError(code)
  return device
}

export class DeviceNotFoundError extends Error {
  constructor(code: string) {
    super(`Equipo ${code} no encontrado`)
  }
}

export async function getDeviceHistory(code: string): Promise<DeviceHistory> {
  await wait(DEMO_DELAY_MS)

  const device = findDevice(code)
  const status = deviceStatuses.find((s) => s.id === device.device_status_id)!
  const risk = getDeviceRiskItem(device.id)
  const currentResult = deviceRiskResults.find((r) => r.device_id === device.id && r.is_current)
  const level = risk && riskLevels.find((l) => l.code === risk.risk_level)!
  const centroid = currentResult?.kmeans_centroid_id
    ? kmeansCentroids.find((c) => c.id === currentResult.kmeans_centroid_id)
    : undefined

  const retirementIncident = device.retired_at
    ? incidents.find((incident) => {
        const action = resolutionActions.find((a) => a.id === incident.resolution_action_id)
        return incident.device_id === device.id && action?.is_retirement_action
      })
    : undefined

  // El último resultado de cada mes, ordenados por fecha.
  const byMonth = new Map<string, (typeof deviceRiskResults)[number]>()
  deviceRiskResults
    .filter((r) => r.device_id === device.id)
    .sort((a, b) => a.calculated_at.localeCompare(b.calculated_at))
    .forEach((r) => byMonth.set(r.calculated_at.slice(0, 7), r))

  return {
    code: device.code,
    type_name: deviceTypes.find((t) => t.id === device.device_type_id)!.name,
    laboratory_code: laboratories.find((lab) => lab.id === device.laboratory_id)!.code,
    physical_location: device.physical_location,
    specifications: device.specifications,
    status: status.code,
    status_name: status.name,
    retirement: device.retired_at
      ? {
          retired_at: device.retired_at,
          incident_number: retirementIncident?.incident_number ?? null,
          action_name:
            resolutionActions.find((a) => a.id === retirementIncident?.resolution_action_id)?.name ?? null,
        }
      : null,
    current_risk:
      risk && level && currentResult
        ? {
            ...risk,
            risk_level_info: level,
            calculated_at: currentResult.calculated_at,
            group_average: centroid
              ? {
                  incident_count: centroid.avg_incident_count,
                  days_since_last_failure: centroid.avg_days_since_last_failure,
                  failure_interval_days: centroid.avg_failure_interval_days,
                }
              : null,
          }
        : null,
    risk_history: device.retired_at
      ? []
      : [...byMonth.entries()].map(([month, result]) => ({
          month,
          risk_level: riskLevels.find((l) => l.id === result.risk_level_id)!.code,
          classification_method: result.classification_method,
        })),
  }
}

export async function getDeviceIncidents(code: string, page: number): Promise<DeviceIncidentPage> {
  await wait(DEMO_DELAY_MS)

  const device = findDevice(code)
  const items = incidents
    .filter((incident) => incident.device_id === device.id && incident.is_active)
    .sort((a, b) => b.opened_at.localeCompare(a.opened_at))
    .map((incident) => {
      const closedBy = users.find((u) => u.id === incident.closed_by_id)
      return {
        id: incident.id,
        incident_number: incident.incident_number,
        opened_at: incident.opened_at,
        component_name: components.find((c) => c.id === incident.component_id)!.name,
        priority: incident.priority,
        status: incidentStatuses.find((s) => s.id === incident.incident_status_id)!.code,
        diagnosis: incident.diagnosis,
        resolution_action_name:
          resolutionActions.find((a) => a.id === incident.resolution_action_id)?.name ?? null,
        resolution_time_minutes: incident.resolution_time_minutes,
        technician_name: closedBy ? `${closedBy.first_name} ${closedBy.last_name}` : null,
      }
    })

  const start = (page - 1) * HISTORY_PAGE_SIZE
  return { items: items.slice(start, start + HISTORY_PAGE_SIZE), total: items.length, now: DEMO_NOW }
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

export class DuplicateDeviceCodeError extends Error {
  constructor(code: string) {
    super(`Ya existe un equipo con el código ${code}`)
  }
}

export class InvalidDeviceCodeError extends Error {}

// RN-11: formato LAB-TIPO-NN, por ejemplo H103-PC-13.
export const DEVICE_CODE_PATTERN = /^[A-Z]\d{3}-[A-Z]{2,5}-\d{2}$/

const RISK_ORDER: Record<RiskLevel['code'], number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function toDeviceListItem(device: (typeof devices)[number]): DeviceListItem {
  const risk = getDeviceRiskItem(device.id)
  return {
    id: device.id,
    code: device.code,
    laboratory_id: device.laboratory_id,
    laboratory_code: laboratories.find((lab) => lab.id === device.laboratory_id)!.code,
    device_type_id: device.device_type_id,
    type_name: deviceTypes.find((t) => t.id === device.device_type_id)!.name,
    physical_location: device.physical_location,
    specifications: device.specifications,
    status: deviceStatuses.find((s) => s.id === device.device_status_id)!.code,
    risk_level: risk?.risk_level ?? null,
    // Con riesgo vigente, las incidencias que contó el modelo; si no, las registradas.
    incident_count:
      risk?.incident_count ?? incidents.filter((i) => i.device_id === device.id && i.is_active).length,
  }
}

export async function listDevices(filters: DeviceListFilters) {
  await wait(DEMO_DELAY_MS)

  const search = filters.search.trim().toLowerCase()
  const risk = new Map(devices.map((d) => [d.id, getDeviceRiskItem(d.id)]))
  const retiredAt = new Map(devices.map((d) => [d.id, d.retired_at]))

  const filtered = devices
    .filter((d) => d.is_active)
    .map(toDeviceListItem)
    .filter(
      (item) =>
        (!search || item.code.toLowerCase().includes(search)) &&
        (filters.laboratory_id === null || item.laboratory_id === filters.laboratory_id) &&
        (filters.device_type_id === null || item.device_type_id === filters.device_type_id) &&
        (filters.status === 'ALL' || item.status === filters.status) &&
        (filters.risk_level === null || item.risk_level === filters.risk_level),
    )
    // Riesgo de mayor a menor; luego más incidencias y la falla más reciente primero.
    // Los retirados (sin riesgo) van al final, del retiro más reciente al más antiguo (Figma 5.5).
    .sort((a, b) => {
      const byRisk = (a.risk_level ? RISK_ORDER[a.risk_level] : 3) - (b.risk_level ? RISK_ORDER[b.risk_level] : 3)
      if (byRisk !== 0) return byRisk
      if (!a.risk_level) return (retiredAt.get(b.id) ?? '').localeCompare(retiredAt.get(a.id) ?? '')
      if (a.incident_count !== b.incident_count) return b.incident_count - a.incident_count
      const daysA = risk.get(a.id)?.days_since_last_failure ?? Infinity
      const daysB = risk.get(b.id)?.days_since_last_failure ?? Infinity
      return daysA - daysB
    })

  const start = (filters.page - 1) * DEVICE_PAGE_SIZE
  return { items: filtered.slice(start, start + DEVICE_PAGE_SIZE), total: filtered.length }
}

function assertValidCode(input: DeviceInput, exceptId: number | null): string {
  const code = input.code.trim().toUpperCase()
  const laboratory = laboratories.find((lab) => lab.id === input.laboratory_id)!
  const type = deviceTypes.find((t) => t.id === input.device_type_id)!
  if (!DEVICE_CODE_PATTERN.test(code) || !code.startsWith(`${laboratory.code}-${type.code}-`)) {
    throw new InvalidDeviceCodeError(code)
  }
  if (devices.some((d) => d.code === code && d.id !== exceptId)) throw new DuplicateDeviceCodeError(code)
  return code
}

export async function createDevice(input: DeviceInput): Promise<void> {
  await wait(SAVE_DELAY_MS)

  const code = assertValidCode(input, null)
  const id = Math.max(...devices.map((d) => d.id)) + 1
  devices.push({
    id,
    is_active: true,
    created_at: DEMO_NOW,
    updated_at: DEMO_NOW,
    ...input,
    code,
    device_status_id: deviceStatuses.find((s) => s.code === 'ACTIVE')!.id,
    retired_at: null,
  })
  // RN-23: sin incidencias, el equipo queda en riesgo bajo por regla hasta el próximo cálculo.
  deviceRiskResults.push({
    id: Math.max(...deviceRiskResults.map((r) => r.id)) + 1,
    is_active: true,
    created_at: DEMO_NOW,
    updated_at: DEMO_NOW,
    kmeans_run_id: deviceRiskResults[0].kmeans_run_id,
    device_id: id,
    classification_method: 'INSUFFICIENT_HISTORY',
    kmeans_centroid_id: null,
    risk_level_id: riskLevels.find((l) => l.code === 'LOW')!.id,
    incident_count: 0,
    days_since_last_failure: null,
    avg_failure_interval_days: null,
    distance_to_centroid: null,
    is_current: true,
    calculated_at: DEMO_NOW,
  })
}

// El código no se edita. Pasar a RETIRED retira el equipo (RN-12); un retirado no vuelve a activo.
export async function updateDevice(
  id: number,
  input: Omit<DeviceInput, 'code'> & { status: DeviceStatusCode },
): Promise<void> {
  await wait(SAVE_DELAY_MS)

  const device = devices.find((d) => d.id === id)!
  const wasRetired = device.retired_at !== null
  Object.assign(device, {
    laboratory_id: input.laboratory_id,
    device_type_id: input.device_type_id,
    physical_location: input.physical_location,
    specifications: input.specifications,
    updated_at: DEMO_NOW,
  })

  if (!wasRetired && input.status === 'RETIRED') {
    device.device_status_id = deviceStatuses.find((s) => s.code === 'RETIRED')!.id
    device.retired_at = DEMO_NOW
    deviceRiskResults.filter((r) => r.device_id === id).forEach((r) => (r.is_current = false))
  }
}

// Opciones del formulario: laboratorios activos y tipos seleccionados en el catálogo (RN-07).
export function getDeviceFormOptions() {
  return {
    laboratories: laboratories.filter((lab) => lab.is_active),
    deviceTypes: deviceTypes.filter((type) => type.is_selected && type.is_active),
  }
}
