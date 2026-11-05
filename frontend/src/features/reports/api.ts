import { apiRequest } from '../../lib/apiClient'
import type { RiskLevelCode } from '../../types/catalog'
import type { Priority } from '../../types/incident'

// Usa la API real: GET reports/summary (D-40). Los conteos los calcula el backend.

export type ReportFilters = {
  // Fechas aaaa-mm-dd en hora de Ecuador.
  from: string
  to: string
  laboratory_id: number | null
}

export type CountRow = { id: number; label: string; count: number }

export type TechnicianRow = {
  id: number
  name: string
  registered_count: number
  closed_count: number
  avg_resolution_minutes: number | null
}

export type TopDevice = {
  code: string
  laboratory_code: string
  type_name: string
  incident_count: number
  // Vacío si el equipo está retirado.
  risk_level: RiskLevelCode | null
}

export type ReportSummary = {
  period: { from: string; to: string }
  indicators: {
    registered_count: number
    closed_count: number
    avg_resolution_minutes: number | null
    retired_device_count: number
  }
  by_laboratory: CountRow[]
  by_component: CountRow[]
  by_priority: { priority: Priority; count: number }[]
  by_technician: TechnicianRow[]
  top_devices: TopDevice[]
}

export function getReportSummary(filters: ReportFilters): Promise<ReportSummary> {
  const params = new URLSearchParams({ from: filters.from, to: filters.to })
  if (filters.laboratory_id !== null) params.set('laboratory_id', String(filters.laboratory_id))
  return apiRequest(`/reports/summary?${params}`)
}
