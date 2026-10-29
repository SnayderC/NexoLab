import { useQuery } from '@tanstack/react-query'
import { getDeviceOptions, type DeviceOptions } from './api'

const EMPTY: DeviceOptions = { laboratories: [], deviceTypes: [] }

// Laboratorios activos y tipos seleccionados para filtros y formularios (también los usa el Dashboard).
export function useDeviceOptions() {
  const query = useQuery({ queryKey: ['devices', 'options'], queryFn: getDeviceOptions })
  return { options: query.data ?? EMPTY, isPending: query.isPending }
}
