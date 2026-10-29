import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCatalogType, getCatalogs, listCatalogTypes, saveCatalogSelection } from './api'

// Catálogos pequeños (componentes, acciones, roles...). Cambian muy poco: se guardan en caché.
export function useCatalogs() {
  return useQuery({ queryKey: ['catalogs'], queryFn: getCatalogs, staleTime: Infinity })
}

export function useCatalogTypes() {
  return useQuery({ queryKey: ['catalog'], queryFn: listCatalogTypes })
}

// La selección cambia los formularios, los filtros y el riesgo.
function useInvalidateCatalog() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [['catalog'], ['devices'], ['dashboard'], ['incidents']].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useSaveCatalogSelection() {
  const invalidate = useInvalidateCatalog()
  return useMutation({ mutationFn: saveCatalogSelection, onSuccess: invalidate })
}

export function useAddCatalogType() {
  const invalidate = useInvalidateCatalog()
  return useMutation({ mutationFn: addCatalogType, onSuccess: invalidate })
}
