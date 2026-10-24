import type { BaseRecord } from './base'

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

// trx_incidents
export type Incident = BaseRecord & {
  incident_number: string
  device_id: number
  component_id: number
  incident_status_id: number
  resolution_action_id: number | null
  reported_by_id: number
  closed_by_id: number | null
  priority: Priority
  description: string
  diagnosis: string | null
  notes: string | null
  // Cuándo ocurrió la falla. created_at es cuándo se registró en el sistema.
  opened_at: string
  closed_at: string | null
  resolution_time_minutes: number | null
}
