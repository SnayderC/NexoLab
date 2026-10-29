import { deviceStatuses, deviceTypes } from '../../mocks/catalogs'
import { DEMO_NOW } from '../../mocks/demoClock'
import { devices } from '../../mocks/devices'

// Por ahora trabaja sobre mocks/ (en memoria). En la fase 7 llamará a GET device-types,
// POST device-types y PUT device-types/selection (sección 13).

export type CatalogType = {
  id: number
  code: string
  name: string
  is_selected: boolean
  active_device_count: number
}

export class DuplicateTypeCodeError extends Error {
  constructor(code: string) {
    super(`Ya existe un tipo con el código ${code}`)
  }
}

export class NoSelectedTypeError extends Error {}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listCatalogTypes(): Promise<CatalogType[]> {
  await wait(400)
  const activeStatusId = deviceStatuses.find((s) => s.code === 'ACTIVE')!.id

  return deviceTypes
    .filter((type) => type.is_active)
    .map((type) => ({
      id: type.id,
      code: type.code,
      name: type.name,
      is_selected: type.is_selected,
      active_device_count: devices.filter(
        (d) => d.device_type_id === type.id && d.is_active && d.device_status_id === activeStatusId,
      ).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// RN-07: debe quedar al menos un tipo seleccionado. RN-08: al guardar se recalcula el riesgo
// (disparador CATALOG_CHANGE); con datos de demostración el resultado no cambia.
export async function saveCatalogSelection(selectedIds: number[]): Promise<void> {
  await wait(800)
  if (selectedIds.length === 0) throw new NoSelectedTypeError()
  deviceTypes.forEach((type) => {
    type.is_selected = selectedIds.includes(type.id)
    type.updated_at = DEMO_NOW
  })
}

// RN-09: un tipo nuevo se agrega sin seleccionar.
export async function addCatalogType(input: { code: string; name: string }): Promise<void> {
  await wait(500)
  const code = input.code.trim().toUpperCase()
  if (deviceTypes.some((type) => type.code === code)) throw new DuplicateTypeCodeError(code)
  deviceTypes.push({
    id: Math.max(...deviceTypes.map((t) => t.id)) + 1,
    is_active: true,
    created_at: DEMO_NOW,
    updated_at: DEMO_NOW,
    code,
    name: input.name.trim(),
    is_selected: false,
  })
}
