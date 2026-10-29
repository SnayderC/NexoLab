import { ApiError, apiRequest } from '../../lib/apiClient'
import type {
  AffectedComponent,
  DeviceStatus,
  IncidentStatus,
  ResolutionAction,
  RiskLevel,
  Role,
} from '../../types/catalog'

// Usa la API real: GET catalogs, GET/POST device-types y PUT device-types/selection (sección 13).

// ---------- Catálogos pequeños (formularios y filtros de varios módulos) ----------

export type Catalogs = {
  roles: Role[]
  device_statuses: DeviceStatus[]
  components: AffectedComponent[]
  incident_statuses: IncidentStatus[]
  resolution_actions: ResolutionAction[]
  risk_levels: RiskLevel[]
}

export function getCatalogs(): Promise<Catalogs> {
  return apiRequest<Catalogs>('/catalogs')
}

// ---------- Catálogo de tipos de equipo (Figma 5.9 y 5.10) ----------

export type CatalogType = {
  id: number
  code: string
  name: string
  is_selected: boolean
  active_device_count: number
}

export class DuplicateTypeCodeError extends Error {}

export class NoSelectedTypeError extends Error {}

export async function listCatalogTypes(): Promise<CatalogType[]> {
  const types = await apiRequest<(CatalogType & { is_active: boolean })[]>('/device-types')
  return types
    .filter((type) => type.is_active)
    .map(({ id, code, name, is_selected, active_device_count }) => ({
      id,
      code,
      name,
      is_selected,
      active_device_count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// RN-07: debe quedar al menos un tipo seleccionado. RN-08: al guardar, el backend recalcula
// el riesgo (disparador CATALOG_CHANGE). Devuelve el error del cálculo, si lo hubo.
export async function saveCatalogSelection(selectedIds: number[]): Promise<{ risk_error: string | null }> {
  try {
    return await apiRequest('/device-types/selection', { method: 'PUT', body: { selected_ids: selectedIds } })
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) throw new NoSelectedTypeError()
    throw error
  }
}

// RN-09: un tipo nuevo se agrega sin seleccionar. D-37: su código tiene de 2 a 5 letras.
export async function addCatalogType(input: { code: string; name: string }): Promise<void> {
  try {
    await apiRequest('/device-types', { method: 'POST', body: input })
  } catch (error) {
    if (error instanceof ApiError && error.status === 400 && Array.isArray(error.data.code)) {
      throw new DuplicateTypeCodeError(String(error.data.code[0]))
    }
    throw error
  }
}
