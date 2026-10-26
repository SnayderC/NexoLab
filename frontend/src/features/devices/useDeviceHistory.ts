import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDeviceHistory, getDeviceIncidents } from './api'

export function useDeviceHistory(code: string) {
  return useQuery({
    queryKey: ['devices', 'history', code],
    queryFn: () => getDeviceHistory(code),
    // Un equipo que no existe no se vuelve a pedir.
    retry: false,
  })
}

export function useDeviceIncidents(code: string, page: number) {
  return useQuery({
    queryKey: ['devices', 'incidents', code, page],
    queryFn: () => getDeviceIncidents(code, page),
    placeholderData: keepPreviousData,
    retry: false,
  })
}
