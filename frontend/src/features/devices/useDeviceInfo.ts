import { useQuery } from '@tanstack/react-query'
import { getDeviceInfo } from './api'

// Información de un equipo; no pide nada mientras no haya un equipo elegido.
export function useDeviceInfo(deviceId: number | null) {
  return useQuery({
    queryKey: ['devices', 'info', deviceId],
    queryFn: () => getDeviceInfo(deviceId!),
    enabled: deviceId !== null,
  })
}
