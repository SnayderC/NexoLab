import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLaboratory,
  getResponsibleOptions,
  listLaboratories,
  setLaboratoryActive,
  updateLaboratory,
  type LaboratoryInput,
} from './api'

export function useResponsibleOptions() {
  return useQuery({ queryKey: ['users', 'technicians'], queryFn: getResponsibleOptions })
}

export function useLaboratories() {
  return useQuery({ queryKey: ['laboratories'], queryFn: listLaboratories })
}

// Los laboratorios aparecen también en filtros y formularios de otras pantallas.
function useInvalidateLaboratories() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [['laboratories'], ['incidents'], ['dashboard'], ['devices']].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useSaveLaboratory() {
  const invalidate = useInvalidateLaboratories()
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: LaboratoryInput }) =>
      id === null ? createLaboratory(input) : updateLaboratory(id, input),
    onSuccess: invalidate,
  })
}

export function useSetLaboratoryActive() {
  const invalidate = useInvalidateLaboratories()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setLaboratoryActive(id, isActive),
    onSuccess: invalidate,
  })
}
