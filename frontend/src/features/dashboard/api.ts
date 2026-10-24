import { components, deviceTypes, incidentStatuses, riskLevels } from '../../mocks/catalogs'
import { DEMO_NOW } from '../../mocks/demoClock'
import { devices } from '../../mocks/devices'
import { AVG_RESOLUTION_MINUTES_LAST_30_DAYS, incidents } from '../../mocks/incidents'
import { laboratories } from '../../mocks/laboratories'
import { deviceRiskResults, kmeansCentroids, lastKmeansRun } from '../../mocks/risk'
import { getDeviceRiskItem } from '../devices/api'
import type { DeviceRiskItem } from '../devices/types'
import type { RiskLevel } from '../../types/catalog'
import type { Priority } from '../../types/incident'

// Por ahora arma con mocks/ lo que devolverá GET dashboard/summary (sección 13).

export type DashboardFilters = {
  laboratory_id: number | null
  device_type_id: number | null
}

export type RiskGroup = {
  risk_level: RiskLevel
  // Perfil promedio del grupo (centroide). No cambia con los filtros.
  avg_incident_count: number
  avg_days_since_last_failure: number
  avg_failure_interval_days: number
  devices: DeviceRiskItem[]
}

export type OpenIncidentItem = {
  id: number
  incident_number: string
  device_code: string
  component_name: string
  priority: Priority
  opened_at: string
}

export type DashboardSummary = {
  // Los indicadores son globales: no cambian con los filtros (Figma 2.2).
  indicators: {
    open_incident_count: number
    open_high_priority_count: number
    avg_resolution_minutes: number
    high_risk_device_count: number
    active_device_count: number
  }
  last_run: {
    finished_at: string
    kmeans_device_count: number
    insufficient_history_count: number
  }
  risk_groups: RiskGroup[]
  open_incidents: OpenIncidentItem[]
  // Referencia para los tiempos relativos ("hace 1 h").
  generated_at: string
}

const DEMO_DELAY_MS = 500
const RECALCULATE_DELAY_MS = 1500

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function matchesFilters(deviceId: number, filters: DashboardFilters) {
  const device = devices.find((d) => d.id === deviceId)!
  return (
    (filters.laboratory_id === null || device.laboratory_id === filters.laboratory_id) &&
    (filters.device_type_id === null || device.device_type_id === filters.device_type_id)
  )
}

function buildSummary(filters: DashboardFilters): DashboardSummary {
  const openStatusId = incidentStatuses.find((status) => status.code === 'OPEN')!.id
  const openIncidents = incidents.filter((incident) => incident.incident_status_id === openStatusId)
  const currentResults = deviceRiskResults.filter((result) => result.is_current)
  const highRiskLevelId = riskLevels.find((level) => level.code === 'HIGH')!.id

  return {
    indicators: {
      open_incident_count: openIncidents.length,
      open_high_priority_count: openIncidents.filter((incident) => incident.priority === 'HIGH').length,
      avg_resolution_minutes: AVG_RESOLUTION_MINUTES_LAST_30_DAYS,
      high_risk_device_count: currentResults.filter((r) => r.risk_level_id === highRiskLevelId).length,
      active_device_count: devices.filter((device) => device.retired_at === null).length,
    },
    last_run: {
      finished_at: lastKmeansRun.finished_at!,
      kmeans_device_count: lastKmeansRun.device_count ?? 0,
      insufficient_history_count: currentResults.filter(
        (result) => result.classification_method === 'INSUFFICIENT_HISTORY',
      ).length,
    },
    risk_groups: riskLevels.map((level) => {
      const centroid = kmeansCentroids.find((c) => c.risk_level_id === level.id)!
      return {
        risk_level: level,
        avg_incident_count: centroid.avg_incident_count,
        avg_days_since_last_failure: centroid.avg_days_since_last_failure,
        avg_failure_interval_days: centroid.avg_failure_interval_days,
        devices: currentResults
          .filter((result) => result.risk_level_id === level.id && matchesFilters(result.device_id, filters))
          .map((result) => getDeviceRiskItem(result.device_id)!),
      }
    }),
    open_incidents: openIncidents
      .filter((incident) => matchesFilters(incident.device_id, filters))
      .map((incident) => ({
        id: incident.id,
        incident_number: incident.incident_number,
        device_code: devices.find((d) => d.id === incident.device_id)!.code,
        component_name: components.find((c) => c.id === incident.component_id)!.name,
        priority: incident.priority,
        opened_at: incident.opened_at,
      })),
    generated_at: DEMO_NOW,
  }
}

export async function getDashboardSummary(filters: DashboardFilters): Promise<DashboardSummary> {
  await wait(DEMO_DELAY_MS)
  return buildSummary(filters)
}

// Recalcular ahora (solo administrador, disparador MANUAL). Con datos de demostración
// el resultado no cambia; devuelve cuántos equipos quedaron en cada nivel.
export async function recalculateRisk(): Promise<Record<RiskLevel['code'], number>> {
  await wait(RECALCULATE_DELAY_MS)
  const summary = buildSummary({ laboratory_id: null, device_type_id: null })
  return Object.fromEntries(
    summary.risk_groups.map((group) => [group.risk_level.code, group.devices.length]),
  ) as Record<RiskLevel['code'], number>
}

// Opciones de los filtros: laboratorios activos y tipos seleccionados (RN-07).
export function getDashboardFilterOptions() {
  return {
    laboratories: laboratories.filter((lab) => lab.is_active),
    deviceTypes: deviceTypes.filter((type) => type.is_selected && type.is_active),
  }
}
