import { components, deviceStatuses, deviceTypes, incidentStatuses, riskLevels } from '../../mocks/catalogs'
import { devices } from '../../mocks/devices'
import { incidents } from '../../mocks/incidents'
import { laboratories } from '../../mocks/laboratories'
import { deviceRiskResults } from '../../mocks/risk'
import type { DeviceStatusCode, IncidentStatusCode } from '../../types/catalog'
import type { DeviceRiskItem } from './types'

// Por ahora arma con mocks/ lo que devolverán GET devices/{code} y GET devices/{code}/incidents.

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
