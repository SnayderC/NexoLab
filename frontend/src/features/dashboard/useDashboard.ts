import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardSummary, recalculateRisk, type DashboardFilters } from './api'

export function useDashboardSummary(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'summary', filters],
    queryFn: () => getDashboardSummary(filters),
    // Al cambiar un filtro se mantienen los datos anteriores en vez de volver a los esqueletos.
    placeholderData: keepPreviousData,
  })
}

export function useRecalculateRisk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recalculateRisk,
    // El riesgo también aparece en la lista y el historial de equipos.
    onSuccess: () =>
      Promise.all(
        [['dashboard'], ['devices']].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  })
}
