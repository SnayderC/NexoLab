import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeIncident,
  createIncident,
  getIncident,
  listIncidents,
  type CloseIncidentInput,
  type IncidentListFilters,
} from './api'

export function useIncidentList(filters: IncidentListFilters) {
  return useQuery({
    queryKey: ['incidents', 'list', filters],
    queryFn: () => listIncidents(filters),
    placeholderData: keepPreviousData,
  })
}

// Detalle de una incidencia; no pide nada mientras no haya una elegida.
export function useIncident(incidentNumber: string | null) {
  return useQuery({
    queryKey: ['incidents', 'detail', incidentNumber],
    queryFn: () => getIncident(incidentNumber!),
    enabled: incidentNumber !== null,
  })
}

// Registrar o cerrar cambia la lista, el dashboard y la ficha de los equipos.
function useInvalidateAfterChange() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [['incidents'], ['dashboard'], ['devices']].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useCreateIncident() {
  const invalidate = useInvalidateAfterChange()
  return useMutation({ mutationFn: createIncident, onSuccess: invalidate })
}

export function useCloseIncident() {
  const invalidate = useInvalidateAfterChange()
  return useMutation({
    mutationFn: ({ incidentNumber, input }: { incidentNumber: string; input: CloseIncidentInput }) =>
      closeIncident(incidentNumber, input),
    onSuccess: invalidate,
  })
}
