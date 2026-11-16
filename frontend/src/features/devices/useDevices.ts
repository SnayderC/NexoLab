import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDevice, listDevices, updateDevice, voidDevice, type DeviceListFilters } from './api'

export function useDeviceList(filters: DeviceListFilters) {
  return useQuery({
    queryKey: ['devices', 'list', filters],
    queryFn: () => listDevices(filters),
    placeholderData: keepPreviousData,
  })
}

// Crear o retirar equipos cambia el dashboard, las incidencias y los laboratorios.
function useInvalidateDevices() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [['devices'], ['dashboard'], ['incidents'], ['laboratories']].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useCreateDevice() {
  const invalidate = useInvalidateDevices()
  return useMutation({ mutationFn: createDevice, onSuccess: invalidate })
}

export function useUpdateDevice() {
  const invalidate = useInvalidateDevices()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateDevice>[1] }) => updateDevice(id, input),
    onSuccess: invalidate,
  })
}

export function useVoidDevice() {
  const invalidate = useInvalidateDevices()
  return useMutation({ mutationFn: voidDevice, onSuccess: invalidate })
}
