import type { RiskLevelCode } from '../../types/catalog'
import type { SelectOption } from '../../components/ui/Select'

// Datos solo para la página temporal /dev/componentes (copiados del Figma).
// Las pantallas reales leerán sus datos de features/<módulo>/api.ts.

export type ShowcaseDevice = {
  code: string
  type_name: string
  laboratory_code: string
  physical_location: string
  risk_level: RiskLevelCode
  incident_count: number
}

export const showcaseDevices: ShowcaseDevice[] = [
  { code: 'H103-PC-03', type_name: 'PC de escritorio', laboratory_code: 'H103', physical_location: 'Fila 1, puesto 3', risk_level: 'HIGH', incident_count: 11 },
  { code: 'H105-AIO-04', type_name: 'Todo en uno', laboratory_code: 'H105', physical_location: 'Fila 1, puesto 4', risk_level: 'HIGH', incident_count: 10 },
  { code: 'H103-PC-07', type_name: 'PC de escritorio', laboratory_code: 'H103', physical_location: 'Fila 2, puesto 7', risk_level: 'HIGH', incident_count: 9 },
  { code: 'H104-AIO-08', type_name: 'Todo en uno', laboratory_code: 'H104', physical_location: 'Fila 2, puesto 8', risk_level: 'MEDIUM', incident_count: 5 },
  { code: 'H101-MON-07', type_name: 'Monitor', laboratory_code: 'H101', physical_location: 'Fila 3, puesto 7', risk_level: 'LOW', incident_count: 2 },
]

export const laboratoryOptions: SelectOption[] = ['H101', 'H102', 'H103', 'H104', 'H105'].map(
  (code) => ({ value: code, label: code }),
)

export const deviceTypeOptions: SelectOption[] = [
  { value: 'PC', label: 'PC de escritorio' },
  { value: 'MON', label: 'Monitor' },
  { value: 'AIO', label: 'Todo en uno' },
  { value: 'UPS', label: 'UPS' },
  { value: 'TV', label: 'Televisor' },
]

export const componentOptions: SelectOption[] = ['PC', 'Monitor', 'Teclado', 'Mouse', 'UPS'].map(
  (name) => ({ value: name, label: name }),
)

export const priorityOptions: SelectOption[] = [
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
]
