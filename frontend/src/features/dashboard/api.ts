import { ApiError, apiRequest } from '../../lib/apiClient'
import type { DeviceRiskItem } from '../devices/types'
import type { RiskLevel } from '../../types/catalog'
import type { Priority } from '../../types/incident'

// Usa la API real: GET dashboard/summary y POST risk/recalculate (sección 13).
// El riesgo es el resultado vigente del modelo K-Means (sección 10).

export type DashboardFilters = {
  laboratory_id: number | null
  device_type_id: number | null
}

export type RiskGroup = {
  risk_level: RiskLevel
  // Perfil promedio del grupo (centroide del modelo). No cambia con los filtros.
  // Vacío si todavía no se ha calculado el riesgo.
  avg_incident_count: number | null
  avg_days_since_last_failure: number | null
  avg_failure_interval_days: number | null
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
    // Incidencias cerradas en los últimos 30 días; vacío si no hay ninguna.
    avg_resolution_minutes: number | null
    high_risk_device_count: number
    active_device_count: number
  }
  // Vacío si el modelo todavía no se ha ejecutado.
  last_run: {
    finished_at: string
    kmeans_device_count: number
    insufficient_history_count: number
  } | null
  risk_groups: RiskGroup[]
  open_incidents: OpenIncidentItem[]
  // Hora del servidor: referencia para los tiempos relativos ("hace 1 h").
  generated_at: string
}

type CentroidProfile = {
  avg_incident_count: number
  avg_days_since_last_failure: number
  avg_failure_interval_days: number
}

type SummaryResponse = Omit<DashboardSummary, 'risk_groups'> & {
  risk_groups: { risk_level: RiskLevel; profile: CentroidProfile | null; devices: DeviceRiskItem[] }[]
}

export async function getDashboardSummary(filters: DashboardFilters): Promise<DashboardSummary> {
  const params = new URLSearchParams()
  if (filters.laboratory_id !== null) params.set('laboratory_id', String(filters.laboratory_id))
  if (filters.device_type_id !== null) params.set('device_type_id', String(filters.device_type_id))
  const summary = await apiRequest<SummaryResponse>(`/dashboard/summary?${params}`)

  return {
    ...summary,
    risk_groups: summary.risk_groups.map(({ profile, ...group }) => ({
      ...group,
      avg_incident_count: profile?.avg_incident_count ?? null,
      avg_days_since_last_failure: profile?.avg_days_since_last_failure ?? null,
      avg_failure_interval_days: profile?.avg_failure_interval_days ?? null,
    })),
  }
}

// El cálculo no se pudo completar; el riesgo vigente no cambió.
export class RiskCalculationError extends Error {}

// Recalcular ahora (solo administrador, disparador MANUAL). Devuelve cuántos equipos quedaron en cada nivel.
export async function recalculateRisk(): Promise<Record<RiskLevel['code'], number>> {
  try {
    const run = await apiRequest<{ level_counts: Record<RiskLevel['code'], number> }>('/risk/recalculate', {
      method: 'POST',
    })
    return run.level_counts
  } catch (error) {
    if (error instanceof ApiError && error.data.code === 'risk_failed') throw new RiskCalculationError(error.message)
    throw error
  }
}
