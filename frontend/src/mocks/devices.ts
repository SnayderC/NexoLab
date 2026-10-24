import type { Device } from '../types/device'
import { deviceTypes } from './catalogs'
import { laboratories } from './laboratories'
import { record } from './record'

// Inventario de demostración (parte 3 de docs/PROMPT_FIGMA_MAKE_NEXOLAB.md):
// 142 equipos activos y 3 retirados. Se generan a partir de la composición de cada laboratorio.

// Cantidad de equipos activos por laboratorio y tipo.
const composition: Record<string, Record<string, number>> = {
  H101: { PC: 10, MON: 10, UPS: 8 },
  H102: { PC: 10, MON: 10, UPS: 10 },
  H103: { PC: 12, MON: 12, UPS: 8 },
  H104: { AIO: 12, UPS: 12, TV: 1 },
  H105: { AIO: 12, UPS: 12, TV: 3 },
}

// Equipos retirados, con la fecha de retiro. Ocupan un número dentro de su laboratorio y tipo.
const retiredDevices: Record<string, string> = {
  'H103-PC-09': '2026-10-12T09:15:00-05:00',
  'H101-MON-04': '2026-09-21T10:00:00-05:00',
  'H105-UPS-01': '2026-09-05T11:30:00-05:00',
}

const ACTIVE_STATUS_ID = 1
const RETIRED_STATUS_ID = 2

// Especificaciones de ejemplo por tipo (la de PC aparece en el Figma 3.5).
const specificationsByType: Record<string, string> = {
  PC: 'Intel Core i5, 8 GB RAM',
  MON: 'Monitor 24" Full HD',
  AIO: 'Intel Core i5, 8 GB RAM, pantalla 23,8"',
  UPS: '1000 VA',
  TV: 'Televisor 55"',
}

// Cuatro puestos por fila: puesto 1–4 en la fila 1, 5–8 en la 2, 9–12 en la 3.
function physicalLocation(typeCode: string, number: number): string {
  if (typeCode === 'TV') return 'Frente del aula'
  return `Fila ${Math.ceil(number / 4)}, puesto ${number}`
}

function buildDevices(): Device[] {
  const devices: Device[] = []

  for (const laboratory of laboratories) {
    for (const [typeCode, activeCount] of Object.entries(composition[laboratory.code])) {
      const deviceType = deviceTypes.find((type) => type.code === typeCode)!
      const retiredCount = Object.keys(retiredDevices).filter((code) =>
        code.startsWith(`${laboratory.code}-${typeCode}-`),
      ).length

      for (let number = 1; number <= activeCount + retiredCount; number++) {
        const code = `${laboratory.code}-${typeCode}-${String(number).padStart(2, '0')}`
        const retiredAt = retiredDevices[code] ?? null

        devices.push({
          ...record(devices.length + 1),
          code,
          laboratory_id: laboratory.id,
          device_type_id: deviceType.id,
          device_status_id: retiredAt ? RETIRED_STATUS_ID : ACTIVE_STATUS_ID,
          physical_location: physicalLocation(typeCode, number),
          specifications: specificationsByType[typeCode],
          retired_at: retiredAt,
        })
      }
    }
  }
  return devices
}

export const devices: Device[] = buildDevices()

export function findDeviceByCode(code: string): Device | undefined {
  return devices.find((device) => device.code === code)
}
