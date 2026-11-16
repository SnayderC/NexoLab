import type { BaseRecord } from './base'

// Tablas hst_ del modelo K-Means. Las columnas numeric se reciben como número.

// SCHEDULED: Celery Beat cada 15 minutos. DEVICE_CHANGE: equipo nuevo (D-55).
export type KmeansTriggerType =
  | 'INITIAL_LOAD'
  | 'INCIDENT_CLOSED'
  | 'CATALOG_CHANGE'
  | 'MANUAL'
  | 'SCHEDULED'
  | 'DEVICE_CHANGE'

export type KmeansRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

// hst_kmeans_runs
export type KmeansRun = BaseRecord & {
  trigger_type: KmeansTriggerType
  triggered_by_id: number | null
  incident_id: number | null
  run_status: KmeansRunStatus
  cluster_count: number
  max_iterations: number
  iteration_count: number | null
  has_converged: boolean | null
  random_seed: number
  device_count: number | null
  inertia: number | null
  silhouette_score: number | null
  davies_bouldin_index: number | null
  parameters: Record<string, unknown> | null
  error_message: string | null
  started_at: string
  finished_at: string | null
  duration_ms: number | null
}

// hst_kmeans_centroids
export type KmeansCentroid = BaseRecord & {
  kmeans_run_id: number
  cluster_index: number
  risk_level_id: number
  avg_incident_count: number
  avg_days_since_last_failure: number
  avg_failure_interval_days: number
  device_count: number
}

export type ClassificationMethod = 'KMEANS' | 'INSUFFICIENT_HISTORY'

// hst_device_risk_results
export type DeviceRiskResult = BaseRecord & {
  kmeans_run_id: number
  device_id: number
  classification_method: ClassificationMethod
  kmeans_centroid_id: number | null
  risk_level_id: number
  incident_count: number
  days_since_last_failure: number | null
  avg_failure_interval_days: number | null
  distance_to_centroid: number | null
  is_current: boolean
  calculated_at: string
}
