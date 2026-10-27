import type { RiskLevelCode } from '../types/catalog'
import type { DeviceRiskResult, KmeansCentroid, KmeansRun } from '../types/risk'
import { riskLevels } from './catalogs'
import { devices } from './devices'
import { record } from './record'

// Resultado del modelo copiado del Figma (frames 2.0 y 2.2):
// 6 equipos en riesgo alto, 18 en medio y 118 en bajo (21 por K-Means y 97 sin historial).

const RUN_ID = 27

export const lastKmeansRun: KmeansRun = {
  ...record(RUN_ID),
  trigger_type: 'INCIDENT_CLOSED',
  triggered_by_id: null,
  incident_id: 47,
  run_status: 'COMPLETED',
  cluster_count: 3,
  max_iterations: 100,
  iteration_count: 8,
  has_converged: true,
  random_seed: 42,
  device_count: 45,
  inertia: 18.4213,
  silhouette_score: 0.62,
  davies_bouldin_index: 0.58,
  parameters: null,
  error_message: null,
  started_at: '2026-10-17T10:41:59.700-05:00',
  finished_at: '2026-10-17T10:42:00-05:00',
  duration_ms: 300,
}

const riskLevelId = (code: RiskLevelCode) => riskLevels.find((level) => level.code === code)!.id

// Perfil promedio de cada grupo, tal como aparece en el Figma.
export const kmeansCentroids: KmeansCentroid[] = [
  { ...record(1), kmeans_run_id: RUN_ID, cluster_index: 0, risk_level_id: riskLevelId('HIGH'), avg_incident_count: 9.2, avg_days_since_last_failure: 3, avg_failure_interval_days: 6, device_count: 6 },
  { ...record(2), kmeans_run_id: RUN_ID, cluster_index: 1, risk_level_id: riskLevelId('MEDIUM'), avg_incident_count: 4.1, avg_days_since_last_failure: 18, avg_failure_interval_days: 24, device_count: 18 },
  { ...record(3), kmeans_run_id: RUN_ID, cluster_index: 2, risk_level_id: riskLevelId('LOW'), avg_incident_count: 2.3, avg_days_since_last_failure: 64, avg_failure_interval_days: 71, device_count: 21 },
]

// [incidencias, días desde la última falla, falla cada (días)]
type Stats = [incident_count: number, days_since_last_failure: number, avg_failure_interval_days: number]

// Equipos con nombre en el Figma, en el orden en que aparecen.
const highRisk: Record<string, Stats> = {
  'H103-PC-03': [11, 0, 5],
  'H105-AIO-04': [10, 1, 5],
  'H103-PC-07': [9, 0, 6],
  'H101-UPS-02': [8, 1, 7],
  'H102-PC-10': [8, 2, 9],
  'H103-MON-03': [7, 6, 8],
}

const mediumRisk: Record<string, Stats> = {
  'H104-AIO-08': [5, 2, 20],
  'H101-PC-05': [4, 4, 22],
  'H102-UPS-06': [3, 4, 28],
  'H105-UPS-09': [4, 15, 25],
}

const lowRiskKmeans: Record<string, Stats> = {
  'H101-MON-07': [2, 70, 68],
  'H103-UPS-01': [3, 87, 71],
  'H103-UPS-02': [1, 88, 72],
}

// Equipos sin historial suficiente que aparecen en el Figma: [incidencias, días desde la última falla].
const namedInsufficient: Record<string, [number, number | null]> = {
  'H102-MON-01': [1, 34],
  'H104-TV-01': [0, null],
  'H103-UPS-03': [0, null],
}

// Resto de equipos para completar los totales (5 de los medios son de H103, como en el frame 2.2).
const extraMedium = [
  'H103-PC-01', 'H103-PC-11', 'H103-MON-05', 'H103-MON-10', 'H103-UPS-04',
  'H101-PC-08', 'H101-MON-02', 'H102-PC-03', 'H102-MON-06', 'H102-UPS-09',
  'H104-AIO-02', 'H104-UPS-05', 'H105-AIO-09', 'H105-AIO-11',
]

const extraLowKmeans = [
  'H101-PC-01', 'H101-PC-09', 'H101-UPS-05', 'H102-PC-06', 'H102-MON-08', 'H102-UPS-02',
  'H103-PC-05', 'H103-MON-08', 'H103-MON-11', 'H104-AIO-05', 'H104-AIO-10', 'H104-UPS-01',
  'H104-UPS-09', 'H105-AIO-02', 'H105-AIO-07', 'H105-UPS-05', 'H105-UPS-11', 'H105-TV-02',
]

// Con 3 incidencias y fallas más antiguas, quedan después de los 4 medios del Figma
// al ordenar por incidencias (Figma 5.4).
extraMedium.forEach((code, i) => {
  mediumRisk[code] = [3, 20 + ((i * 3) % 10), 22 + ((i * 5) % 10)]
})
extraLowKmeans.forEach((code, i) => {
  lowRiskKmeans[code] = [2 + (i % 2), 40 + ((i * 11) % 50), 50 + ((i * 13) % 40)]
})

function buildResults(): DeviceRiskResult[] {
  const results: DeviceRiskResult[] = []
  const add = (
    code: string,
    level: RiskLevelCode,
    method: DeviceRiskResult['classification_method'],
    incidentCount: number,
    days: number | null,
    interval: number | null,
  ) => {
    const device = devices.find((d) => d.code === code)!
    results.push({
      ...record(results.length + 1),
      kmeans_run_id: RUN_ID,
      device_id: device.id,
      classification_method: method,
      kmeans_centroid_id:
        method === 'KMEANS' ? kmeansCentroids.find((c) => c.risk_level_id === riskLevelId(level))!.id : null,
      risk_level_id: riskLevelId(level),
      incident_count: incidentCount,
      days_since_last_failure: days,
      avg_failure_interval_days: interval,
      distance_to_centroid: method === 'KMEANS' ? 0.35 : null,
      is_current: true,
      calculated_at: lastKmeansRun.finished_at!,
    })
  }

  for (const [code, stats] of Object.entries(highRisk)) add(code, 'HIGH', 'KMEANS', ...stats)
  for (const [code, stats] of Object.entries(mediumRisk)) add(code, 'MEDIUM', 'KMEANS', ...stats)

  // Riesgo bajo en el orden del Figma: primero los del frame 2.0 y luego los de H103 (frame 2.2).
  const lowOrder = ['H101-MON-07', 'H102-MON-01', 'H104-TV-01', 'H103-UPS-01', 'H103-UPS-02', 'H103-UPS-03']
  const remainingLowKmeans = Object.keys(lowRiskKmeans).filter((code) => !lowOrder.includes(code))
  for (const code of [...lowOrder, ...remainingLowKmeans]) {
    if (code in lowRiskKmeans) add(code, 'LOW', 'KMEANS', ...lowRiskKmeans[code])
    else add(code, 'LOW', 'INSUFFICIENT_HISTORY', ...namedInsufficient[code], null)
  }

  // Los demás equipos activos no tienen historial suficiente (RN-23): riesgo bajo por regla.
  const classified = new Set(results.map((result) => result.device_id))
  devices
    .filter((device) => device.retired_at === null && !classified.has(device.id))
    .forEach((device, i) => {
      const hasOneIncident = i % 3 === 0
      add(device.code, 'LOW', 'INSUFFICIENT_HISTORY', hasOneIncident ? 1 : 0, hasOneIncident ? 20 + ((i * 17) % 100) : null, null)
    })

  return results
}

// Resultados de ejecuciones anteriores, para el gráfico "Evolución del riesgo" (Figma 4.0):
// H103-PC-03 estuvo en riesgo bajo sin historial en agosto y en riesgo medio en septiembre.
function buildPastResults(startId: number): DeviceRiskResult[] {
  const device = devices.find((d) => d.code === 'H103-PC-03')!
  const past: [runId: number, level: RiskLevelCode, method: DeviceRiskResult['classification_method'], count: number, calculatedAt: string][] = [
    [9, 'LOW', 'INSUFFICIENT_HISTORY', 1, '2026-08-27T10:30:00-05:00'],
    [18, 'MEDIUM', 'KMEANS', 7, '2026-09-28T15:30:00-05:00'],
  ]
  return past.map(([runId, level, method, count, calculatedAt], i) => ({
    ...record(startId + i),
    kmeans_run_id: runId,
    device_id: device.id,
    classification_method: method,
    kmeans_centroid_id: null,
    risk_level_id: riskLevelId(level),
    incident_count: count,
    days_since_last_failure: 0,
    avg_failure_interval_days: method === 'KMEANS' ? 6 : null,
    distance_to_centroid: null,
    is_current: false,
    calculated_at: calculatedAt,
  }))
}

const currentResults = buildResults()

export const deviceRiskResults: DeviceRiskResult[] = [
  ...currentResults,
  ...buildPastResults(currentResults.length + 1),
]
