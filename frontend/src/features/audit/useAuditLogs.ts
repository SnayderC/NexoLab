import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listAuditLogs, type AuditLogFilters } from './api'

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => listAuditLogs(filters),
    placeholderData: keepPreviousData,
    // Siempre al día: cada cambio administrativo agrega una entrada.
    staleTime: 0,
  })
}
