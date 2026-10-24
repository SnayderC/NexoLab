import { Plus, SearchX } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Pagination from '../../../components/ui/Pagination'
import TableSkeleton from '../../../components/ui/TableSkeleton'
import Tabs from '../../../components/ui/Tabs'
import { PAGE_SIZE, type IncidentListFilters, type IncidentStatusFilter } from '../api'
import CloseIncidentModal from '../components/CloseIncidentModal'
import IncidentDetailModal from '../components/IncidentDetailModal'
import IncidentFilters from '../components/IncidentFilters'
import IncidentTable from '../components/IncidentTable'
import { useIncidentList } from '../useIncidents'

const initialFilters: IncidentListFilters = {
  status: 'OPEN',
  search: '',
  laboratory_id: null,
  priority: null,
  from: null,
  to: null,
  page: 1,
}

// Parámetros de la URL que abren los modales: ?cerrar=INC-… y ?ver=INC-…
const CLOSE_PARAM = 'cerrar'
const VIEW_PARAM = 'ver'

function IncidentListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(initialFilters)
  const { data, isPending, isError, refetch } = useIncidentList(filters)

  // Al volver de "Registrar incidencia" se resalta la nueva (Figma 3.7).
  const highlightedNumber = (location.state as { highlight?: string } | null)?.highlight ?? null

  const hasActiveFilters =
    filters.search !== '' ||
    filters.laboratory_id !== null ||
    filters.priority !== null ||
    filters.from !== null ||
    filters.to !== null

  function updateFilters(changes: Partial<IncidentListFilters>) {
    // Cualquier cambio de filtro vuelve a la primera página.
    setFilters((current) => ({ ...current, page: 1, ...changes }))
  }

  function openModal(param: string, incidentNumber: string) {
    setSearchParams({ [param]: incidentNumber }, { state: location.state })
  }

  function closeModals() {
    setSearchParams({}, { state: location.state })
  }

  const tabs: { value: IncidentStatusFilter; label: string }[] = [
    { value: 'OPEN', label: `Abiertas (${data?.counts.OPEN ?? '…'})` },
    { value: 'CLOSED', label: `Cerradas (${data?.counts.CLOSED ?? '…'})` },
    { value: 'ALL', label: `Todas (${data?.counts.ALL ?? '…'})` },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-10 items-center justify-between">
        <h1 className="text-2xl font-semibold">Incidencias</h1>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/incidencias/nueva')}>
          Registrar incidencia
        </Button>
      </div>

      <Tabs
        aria-label="Estado de las incidencias"
        tabs={tabs}
        value={filters.status}
        onChange={(status) => updateFilters({ status })}
      />

      <IncidentFilters filters={filters} onChange={updateFilters} />

      {isError && !data ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState title="No se pudieron cargar las incidencias" onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <TableSkeleton rows={7} columns={11} />
      ) : (
        <IncidentTable
          incidents={data.items}
          status={filters.status}
          now={data.now}
          highlightedNumber={highlightedNumber}
          onCloseIncident={(number) => openModal(CLOSE_PARAM, number)}
          onViewIncident={(number) => openModal(VIEW_PARAM, number)}
          emptyState={
            <EmptyState
              icon={SearchX}
              title={hasActiveFilters ? 'No hay incidencias con estos filtros' : 'No hay incidencias'}
              action={
                hasActiveFilters && (
                  <Button onClick={() => setFilters({ ...initialFilters, status: filters.status })}>
                    Limpiar filtros
                  </Button>
                )
              }
            />
          }
          footer={
            data.total > 0 && (
              <Pagination
                page={filters.page}
                pageSize={PAGE_SIZE}
                totalItems={data.total}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            )
          }
        />
      )}

      <CloseIncidentModal incidentNumber={searchParams.get(CLOSE_PARAM)} onClose={closeModals} />
      <IncidentDetailModal incidentNumber={searchParams.get(VIEW_PARAM)} onClose={closeModals} />
    </div>
  )
}

export default IncidentListPage
