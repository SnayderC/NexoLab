import type { BaseRecord } from './base'

// Tablas cat_ de docs/NEXOLAB_BD_v4.dbml.

export type RoleCode = 'TECHNICIAN' | 'ADMIN'

// cat_roles
export type Role = BaseRecord & {
  code: RoleCode
  name: string
}

// cat_device_types
export type DeviceType = BaseRecord & {
  code: string
  name: string
  is_selected: boolean
}

export type DeviceStatusCode = 'ACTIVE' | 'RETIRED'

// cat_device_statuses
export type DeviceStatus = BaseRecord & {
  code: DeviceStatusCode
  name: string
  is_included_in_kmeans: boolean
}

export type ComponentCode = 'PC' | 'MONITOR' | 'KEYBOARD' | 'MOUSE' | 'UPS'

// cat_components. Se llama AffectedComponent para no confundirlo con un componente de React.
export type AffectedComponent = BaseRecord & {
  code: ComponentCode
  name: string
}

export type IncidentStatusCode = 'OPEN' | 'CLOSED'

// cat_incident_statuses
export type IncidentStatus = BaseRecord & {
  code: IncidentStatusCode
  name: string
  is_final: boolean
}

export type ResolutionActionCode = 'RESOLVED' | 'REPLACEMENT_REQUIRED' | 'REFERRED'

// cat_resolution_actions
export type ResolutionAction = BaseRecord & {
  code: ResolutionActionCode
  name: string
  is_retirement_action: boolean
}

export type RiskLevelCode = 'HIGH' | 'MEDIUM' | 'LOW'

// cat_risk_levels
export type RiskLevel = BaseRecord & {
  code: RiskLevelCode
  name: string
  recommended_action: string | null
  color_hex: string | null
}
