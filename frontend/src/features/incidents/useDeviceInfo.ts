import { useQuery } from '@tanstack/react-query'
import { getDeviceInfo, listEligibleDevices } from './api'

// Información de un equipo; no pide nada mientras no haya un equipo elegido.
export function useDeviceInfo(deviceCode: string | null) {
  return useQuery({
    queryKey: ['devices', 'info', deviceCode],
    queryFn: () => getDeviceInfo(deviceCode!),
    enabled: deviceCode !== null,
  })
}

// Equipos del laboratorio elegido que admiten incidencias (RN-13).
export function useEligibleDevices(laboratoryId: number | null) {
  return useQuery({
    queryKey: ['devices', 'eligible', laboratoryId],
    queryFn: () => listEligibleDevices(laboratoryId!),
    enabled: laboratoryId !== null,
  })
}
