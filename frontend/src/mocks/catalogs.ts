import type {
  AffectedComponent,
  DeviceStatus,
  DeviceType,
  IncidentStatus,
  ResolutionAction,
  RiskLevel,
  Role,
} from '../types/catalog'
import { record } from './record'

// Datos de demostración: parte 3 de docs/PROMPT_FIGMA_MAKE_NEXOLAB.md.

export const roles: Role[] = [
  { ...record(1), code: 'TECHNICIAN', name: 'Técnico de soporte' },
  { ...record(2), code: 'ADMIN', name: 'Administrador' },
]

// 32 tipos con los códigos del Figma 5.9; solo los 5 usados en el Bloque H están seleccionados (is_selected).
const deviceTypeRows: [code: string, name: string, is_selected: boolean][] = [
  ['PC', 'PC de escritorio', true],
  ['MON', 'Monitor', true],
  ['AIO', 'Todo en uno', true],
  ['UPS', 'UPS', true],
  ['TV', 'Televisor', true],
  ['LAP', 'Laptop', false],
  ['PRY', 'Proyector', false],
  ['IMP', 'Impresora', false],
  ['IMF', 'Impresora multifunción', false],
  ['ESC', 'Escáner', false],
  ['SWT', 'Switch', false],
  ['RTR', 'Router', false],
  ['APW', 'Punto de acceso inalámbrico', false],
  ['SRV', 'Servidor', false],
  ['TAB', 'Tablet', false],
  ['PZD', 'Pizarra digital', false],
  ['CAM', 'Cámara web', false],
  ['PAR', 'Parlantes', false],
  ['MIC', 'Micrófono', false],
  ['DDE', 'Disco duro externo', false],
  ['NAS', 'Almacenamiento en red (NAS)', false],
  ['FWL', 'Firewall', false],
  ['TIP', 'Teléfono IP', false],
  ['PLT', 'Plotter', false],
  ['LCB', 'Lector de código de barras', false],
  ['KIO', 'Kiosco interactivo', false],
  ['RCK', 'Rack de comunicaciones', false],
  ['CIP', 'Cámara IP', false],
  ['VDC', 'Equipo de videoconferencia', false],
  ['CAU', 'Consola de audio', false],
  ['CDO', 'Cámara de documentos', false],
  ['LBI', 'Lector biométrico', false],
]

export const deviceTypes: DeviceType[] = deviceTypeRows.map(([code, name, is_selected], index) => ({
  ...record(index + 1),
  code,
  name,
  is_selected,
}))

export const deviceStatuses: DeviceStatus[] = [
  { ...record(1), code: 'ACTIVE', name: 'Activo', is_included_in_kmeans: true },
  { ...record(2), code: 'RETIRED', name: 'Retirado', is_included_in_kmeans: false },
]

export const components: AffectedComponent[] = [
  { ...record(1), code: 'PC', name: 'PC' },
  { ...record(2), code: 'MONITOR', name: 'Monitor' },
  { ...record(3), code: 'KEYBOARD', name: 'Teclado' },
  { ...record(4), code: 'MOUSE', name: 'Mouse' },
  { ...record(5), code: 'UPS', name: 'UPS' },
]

export const incidentStatuses: IncidentStatus[] = [
  { ...record(1), code: 'OPEN', name: 'Abierta', is_final: false },
  { ...record(2), code: 'CLOSED', name: 'Cerrada', is_final: true },
]

export const resolutionActions: ResolutionAction[] = [
  { ...record(1), code: 'RESOLVED', name: 'Resuelto', is_retirement_action: false },
  { ...record(2), code: 'REPLACEMENT_REQUIRED', name: 'Requiere reemplazo', is_retirement_action: true },
  { ...record(3), code: 'REFERRED', name: 'Derivado', is_retirement_action: false },
]

export const riskLevels: RiskLevel[] = [
  { ...record(1), code: 'HIGH', name: 'Riesgo alto', recommended_action: 'Revisar hoy', color_hex: '#EF4444' },
  { ...record(2), code: 'MEDIUM', name: 'Riesgo medio', recommended_action: 'Programar revisión esta semana', color_hex: '#F59E0B' },
  { ...record(3), code: 'LOW', name: 'Riesgo bajo', recommended_action: 'Monitoreo normal', color_hex: '#10B981' },
]
