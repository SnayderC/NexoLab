import type { ComponentCode, ResolutionActionCode } from '../types/catalog'
import type { Incident, Priority } from '../types/incident'
import { components, resolutionActions } from './catalogs'
import { findDeviceByCode } from './devices'
import { record } from './record'

// Incidencias de demostración (parte 3 de docs/PROMPT_FIGMA_MAKE_NEXOLAB.md y Figma 3.1):
// 7 abiertas y 26 cerradas. Registrar y cerrar las modifican en memoria; al recargar
// la página vuelven a este estado inicial.

// Tiempo promedio de atención de los últimos 30 días, tal como aparece en el Figma.
// Con todas las incidencias reales lo calculará el backend.
export const AVG_RESOLUTION_MINUTES_LAST_30_DAYS = 48

const OPEN_STATUS_ID = 1
const CLOSED_STATUS_ID = 2
const ANDREA_ID = 1
const CARLOS_ID = 2

type IncidentSeed = {
  id: number
  device: string
  component: ComponentCode
  priority: Priority
  opened_at: string
  reported_by_id: number
  // Quién la cerró; por defecto Carlos Mendoza.
  closed_by_id?: number
  description: string
  closing?: {
    closed_at: string
    minutes: number
    action: ResolutionActionCode
    diagnosis: string
  }
}

const seeds: IncidentSeed[] = [
  { id: 48, device: 'H103-PC-07', component: 'KEYBOARD', priority: 'HIGH', opened_at: '2026-10-17T09:15:00-05:00', reported_by_id: CARLOS_ID, description: 'Varias teclas no responden al presionarlas.' },
  { id: 46, device: 'H105-AIO-04', component: 'PC', priority: 'HIGH', opened_at: '2026-10-16T15:40:00-05:00', reported_by_id: CARLOS_ID, description: 'El equipo se apaga solo durante la clase.' },
  { id: 45, device: 'H101-UPS-02', component: 'UPS', priority: 'HIGH', opened_at: '2026-10-16T11:05:00-05:00', reported_by_id: CARLOS_ID, description: 'El UPS emite pitidos y no mantiene encendido el equipo.' },
  { id: 44, device: 'H102-PC-10', component: 'MOUSE', priority: 'MEDIUM', opened_at: '2026-10-15T10:30:00-05:00', reported_by_id: CARLOS_ID, description: 'El puntero del mouse se mueve de forma errática.' },
  { id: 43, device: 'H104-AIO-08', component: 'PC', priority: 'MEDIUM', opened_at: '2026-10-15T08:50:00-05:00', reported_by_id: ANDREA_ID, description: 'El equipo tarda varios minutos en iniciar.' },
  { id: 40, device: 'H101-PC-05', component: 'MONITOR', priority: 'LOW', opened_at: '2026-10-13T14:20:00-05:00', reported_by_id: CARLOS_ID, description: 'El monitor parpadea de vez en cuando.' },
  { id: 39, device: 'H102-UPS-06', component: 'UPS', priority: 'MEDIUM', opened_at: '2026-10-13T09:00:00-05:00', reported_by_id: CARLOS_ID, description: 'La batería del UPS dura muy poco.' },
  {
    id: 47, device: 'H103-PC-03', component: 'MOUSE', priority: 'MEDIUM', opened_at: '2026-10-17T08:00:00-05:00', reported_by_id: CARLOS_ID, description: 'El mouse no responde al moverlo.',
    closing: { closed_at: '2026-10-17T08:25:00-05:00', minutes: 25, action: 'RESOLVED', diagnosis: 'Cable USB dañado; se reemplazó el mouse.' },
  },
  {
    id: 42, device: 'H103-PC-03', component: 'PC', priority: 'HIGH', opened_at: '2026-10-14T10:00:00-05:00', reported_by_id: CARLOS_ID, description: 'El equipo no enciende.',
    closing: { closed_at: '2026-10-14T12:10:00-05:00', minutes: 130, action: 'RESOLVED', diagnosis: 'Fuente de poder con conexión floja; se aseguró el conector.' },
  },
  {
    id: 41, device: 'H103-PC-09', component: 'PC', priority: 'HIGH', opened_at: '2026-10-12T08:30:00-05:00', reported_by_id: CARLOS_ID, description: 'El equipo no arranca y no muestra imagen.',
    closing: { closed_at: '2026-10-12T09:15:00-05:00', minutes: 45, action: 'REPLACEMENT_REQUIRED', diagnosis: 'Placa madre dañada, sin reparación posible.' },
  },
  {
    id: 38, device: 'H105-AIO-04', component: 'PC', priority: 'HIGH', opened_at: '2026-10-10T13:00:00-05:00', reported_by_id: CARLOS_ID, description: 'La pantalla se queda en negro al iniciar.',
    closing: { closed_at: '2026-10-10T13:40:00-05:00', minutes: 40, action: 'REFERRED', diagnosis: 'Falla de placa; enviado a taller externo.' },
  },
  // Historial de H103-PC-03 y H103-PC-09 que aparece en el Figma 4.0 y 4.2.
  // 0002 es la incidencia de la página 2 del historial (el Figma no muestra sus datos).
  ...([
    [29, 'H103-PC-03', 'PC', 'HIGH', '2026-10-03T09:40', 35, 'El equipo no enciende.', 'No enciende; se reemplazó el cable de poder.'],
    [25, 'H103-PC-03', 'PC', 'MEDIUM', '2026-09-28T14:15', 65, 'El sistema operativo no carga.', 'El sistema operativo no carga; se reparó el arranque.'],
    [21, 'H103-PC-03', 'PC', 'HIGH', '2026-09-23T08:30', 100, 'El equipo se apaga por calor.', 'Sobrecalentamiento; limpieza interna y cambio de pasta térmica.'],
    [17, 'H103-PC-03', 'MOUSE', 'LOW', '2026-09-18T11:00', 10, 'El clic izquierdo no responde.', 'Falla el clic izquierdo; se reemplazó el mouse.'],
    [10, 'H103-PC-03', 'KEYBOARD', 'LOW', '2026-09-08T15:30', 20, 'Se derramó líquido sobre el teclado.', 'Teclado con líquido derramado; se reemplazó.'],
    [6, 'H103-PC-03', 'PC', 'HIGH', '2026-09-02T09:00', 45, 'El equipo no arranca el sistema.', 'No detecta el disco duro; se reconectó el cable SATA.'],
    [2, 'H103-PC-03', 'PC', 'MEDIUM', '2026-08-27T10:00', 30, 'El ventilador hace mucho ruido.', 'Ventilador ruidoso; limpieza del ventilador.'],
    [31, 'H103-PC-09', 'PC', 'HIGH', '2026-10-04T11:20', 90, 'El equipo se apaga de repente.', 'Apagados repentinos; se reemplazó la fuente de poder.'],
    [22, 'H103-PC-09', 'PC', 'MEDIUM', '2026-09-24T09:10', 40, 'El equipo no arranca.', 'No arranca; se reconectó la memoria RAM.'],
  ] as const).map(([id, device, component, priority, openedAt, minutes, description, diagnosis]): IncidentSeed => {
    const opened_at = `${openedAt}:00-05:00`
    const closedAt = new Date(new Date(opened_at).getTime() + minutes * 60_000).toISOString()
    return {
      id, device, component, priority, opened_at, reported_by_id: CARLOS_ID, description,
      closing: { closed_at: closedAt, minutes, action: 'RESOLVED', diagnosis },
    }
  }),
  {
    id: 14, device: 'H103-PC-03', component: 'PC', priority: 'MEDIUM', opened_at: '2026-09-13T10:20:00-05:00', reported_by_id: ANDREA_ID, closed_by_id: ANDREA_ID, description: 'El equipo se reinicia solo.',
    closing: { closed_at: '2026-09-13T11:10:00-05:00', minutes: 50, action: 'RESOLVED', diagnosis: 'Reinicios inesperados; se actualizaron los controladores.' },
  },
  // Equipos retirados del Figma 5.5: H101-MON-04 (2 incidencias) y H105-UPS-01 (4).
  // La última de cada uno se cerró con "Requiere reemplazo" en la fecha de retiro.
  {
    id: 12, device: 'H101-MON-04', component: 'MONITOR', priority: 'MEDIUM', opened_at: '2026-09-04T08:40:00-05:00', reported_by_id: CARLOS_ID, description: 'La pantalla muestra líneas horizontales.',
    closing: { closed_at: '2026-09-04T09:10:00-05:00', minutes: 30, action: 'RESOLVED', diagnosis: 'Cable de video suelto; se reconectó.' },
  },
  {
    id: 20, device: 'H101-MON-04', component: 'MONITOR', priority: 'HIGH', opened_at: '2026-09-21T09:00:00-05:00', reported_by_id: CARLOS_ID, description: 'El monitor no enciende.',
    closing: { closed_at: '2026-09-21T10:00:00-05:00', minutes: 60, action: 'REPLACEMENT_REQUIRED', diagnosis: 'Panel dañado; sin reparación posible.' },
  },
  {
    id: 1, device: 'H105-UPS-01', component: 'UPS', priority: 'LOW', opened_at: '2026-08-20T10:00:00-05:00', reported_by_id: CARLOS_ID, description: 'El UPS emite un pitido constante.',
    closing: { closed_at: '2026-08-20T10:15:00-05:00', minutes: 15, action: 'RESOLVED', diagnosis: 'Alarma activada por sobrecarga; se redistribuyeron las conexiones.' },
  },
  {
    id: 3, device: 'H105-UPS-01', component: 'UPS', priority: 'MEDIUM', opened_at: '2026-08-25T14:00:00-05:00', reported_by_id: CARLOS_ID, description: 'La batería dura pocos minutos.',
    closing: { closed_at: '2026-08-25T14:25:00-05:00', minutes: 25, action: 'RESOLVED', diagnosis: 'Batería descalibrada; se realizó un ciclo de carga.' },
  },
  {
    id: 4, device: 'H105-UPS-01', component: 'UPS', priority: 'HIGH', opened_at: '2026-08-31T09:00:00-05:00', reported_by_id: CARLOS_ID, description: 'El UPS se apaga al cortar la energía.',
    closing: { closed_at: '2026-08-31T09:40:00-05:00', minutes: 40, action: 'RESOLVED', diagnosis: 'Fusible interno quemado; se reemplazó.' },
  },
  {
    id: 5, device: 'H105-UPS-01', component: 'UPS', priority: 'HIGH', opened_at: '2026-09-05T10:30:00-05:00', reported_by_id: CARLOS_ID, description: 'El UPS no retiene carga.',
    closing: { closed_at: '2026-09-05T11:30:00-05:00', minutes: 60, action: 'REPLACEMENT_REQUIRED', diagnosis: 'Batería agotada; el equipo no admite reemplazo de batería.' },
  },
  // Cerradas que aparecen en el Figma 3.1 (no están en el documento de datos).
  {
    id: 37, device: 'H101-UPS-02', component: 'UPS', priority: 'HIGH', opened_at: '2026-10-09T14:00:00-05:00', reported_by_id: CARLOS_ID, description: 'El UPS se apaga al conectar el equipo.',
    closing: { closed_at: '2026-10-09T14:50:00-05:00', minutes: 50, action: 'RESOLVED', diagnosis: 'Conector de salida suelto; se ajustó la conexión.' },
  },
  {
    id: 36, device: 'H102-PC-10', component: 'PC', priority: 'MEDIUM', opened_at: '2026-10-09T09:30:00-05:00', reported_by_id: CARLOS_ID, description: 'El equipo se congela al abrir varios programas.',
    closing: { closed_at: '2026-10-09T10:15:00-05:00', minutes: 45, action: 'RESOLVED', diagnosis: 'Memoria RAM mal asentada; se reinstaló el módulo.' },
  },
  {
    id: 33, device: 'H105-AIO-04', component: 'PC', priority: 'HIGH', opened_at: '2026-10-06T08:20:00-05:00', reported_by_id: CARLOS_ID, description: 'El equipo no muestra imagen al encender.',
    closing: { closed_at: '2026-10-06T09:30:00-05:00', minutes: 70, action: 'RESOLVED', diagnosis: 'Cable interno de pantalla desconectado; se reconectó.' },
  },
  {
    id: 34, device: 'H103-PC-07', component: 'MOUSE', priority: 'LOW', opened_at: '2026-10-07T11:00:00-05:00', reported_by_id: CARLOS_ID, description: 'El clic derecho del mouse no funciona.',
    closing: { closed_at: '2026-10-07T11:10:00-05:00', minutes: 10, action: 'RESOLVED', diagnosis: 'Mouse defectuoso; se reemplazó por uno nuevo.' },
  },
  {
    id: 32, device: 'H104-AIO-08', component: 'KEYBOARD', priority: 'LOW', opened_at: '2026-10-05T15:00:00-05:00', reported_by_id: ANDREA_ID, closed_by_id: ANDREA_ID, description: 'El teclado escribe caracteres repetidos.',
    closing: { closed_at: '2026-10-05T15:15:00-05:00', minutes: 15, action: 'RESOLVED', diagnosis: 'Suciedad bajo las teclas; limpieza del teclado.' },
  },
  {
    id: 35, device: 'H103-PC-03', component: 'KEYBOARD', priority: 'LOW', opened_at: '2026-10-08T10:10:00-05:00', reported_by_id: CARLOS_ID, description: 'Una tecla del teclado está atascada.',
    closing: { closed_at: '2026-10-08T10:20:00-05:00', minutes: 10, action: 'RESOLVED', diagnosis: 'Tecla atascada; limpieza del teclado.' },
  },
]

export const incidents: Incident[] = seeds
  .map((seed) => ({
  ...record(seed.id, { created_at: seed.opened_at, updated_at: seed.closing?.closed_at ?? seed.opened_at }),
  incident_number: `INC-2026-${String(seed.id).padStart(4, '0')}`,
  device_id: findDeviceByCode(seed.device)!.id,
  component_id: components.find((component) => component.code === seed.component)!.id,
  incident_status_id: seed.closing ? CLOSED_STATUS_ID : OPEN_STATUS_ID,
  resolution_action_id: seed.closing
    ? resolutionActions.find((action) => action.code === seed.closing!.action)!.id
    : null,
  reported_by_id: seed.reported_by_id,
  closed_by_id: seed.closing ? (seed.closed_by_id ?? CARLOS_ID) : null,
  priority: seed.priority,
  description: seed.description,
  diagnosis: seed.closing?.diagnosis ?? null,
  notes: null,
  opened_at: seed.opened_at,
  closed_at: seed.closing?.closed_at ?? null,
  resolution_time_minutes: seed.closing?.minutes ?? null,
}))
  // Más recientes primero, como en la lista del Figma.
  .sort((a, b) => b.opened_at.localeCompare(a.opened_at))
