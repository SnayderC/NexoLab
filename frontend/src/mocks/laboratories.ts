import type { Laboratory } from '../types/laboratory'
import { record } from './record'

// Datos de demostración: parte 3 de docs/PROMPT_FIGMA_MAKE_NEXOLAB.md.
// Todos con responsable Carlos Mendoza (id 2) y activos.

export const laboratories: Laboratory[] = [
  { ...record(1), code: 'H101', name: 'Laboratorio 1', location: 'Bloque H, planta baja', station_count: 10, responsible_technician_id: 2 },
  { ...record(2), code: 'H102', name: 'Laboratorio 2', location: 'Bloque H, planta baja', station_count: 10, responsible_technician_id: 2 },
  { ...record(3), code: 'H103', name: 'Laboratorio de Redes', location: 'Bloque H, planta alta', station_count: 12, responsible_technician_id: 2 },
  { ...record(4), code: 'H104', name: 'Laboratorio 4', location: 'Bloque H, planta alta', station_count: 12, responsible_technician_id: 2 },
  { ...record(5), code: 'H105', name: 'Laboratorio 5', location: 'Bloque H, planta alta', station_count: 12, responsible_technician_id: 2 },
]
