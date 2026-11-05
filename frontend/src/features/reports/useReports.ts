import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getReportSummary, type ReportFilters } from './api'

export function useReportSummary(filters: ReportFilters) {
  return useQuery({
    // Bajo "incidents" para que se actualice al registrar, cerrar o anular incidencias.
    queryKey: ['incidents', 'report', filters],
    queryFn: () => getReportSummary(filters),
    placeholderData: keepPreviousData,
  })
}
