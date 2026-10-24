import type { RiskLevelCode } from '../../types/catalog'
import type { ClassificationMethod } from '../../types/risk'

// Resumen del riesgo actual de un equipo, como lo muestran las tarjetas de equipo.
export type DeviceRiskItem = {
  device_code: string
  laboratory_code: string
  device_type_name: string
  risk_level: RiskLevelCode
  classification_method: ClassificationMethod
  incident_count: number
  days_since_last_failure: number | null
  avg_failure_interval_days: number | null
}
