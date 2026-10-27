import { Plus, SearchX } from 'lucide-react'
import { useState } from 'react'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Pagination from '../../../components/ui/Pagination'
import TableSkeleton from '../../../components/ui/TableSkeleton'
import { DEVICE_PAGE_SIZE, type DeviceListFilters, type DeviceListItem } from '../api'
import DeviceFilters from '../components/DeviceFilters'
import DeviceFormModal from '../components/DeviceFormModal'
import DeviceTable from '../components/DeviceTable'
import { useDeviceList } from '../useDevices'

const initialFilters: DeviceListFilters = {
  search: '',
  laboratory_id: null,
  device_type_id: null,
  status: 'ACTIVE',
  risk_level: null,
  page: 1,
}

// Modal de formulario: cerrado, nuevo (null) o editando un equipo.
type FormState = { open: false } | { open: true; device: DeviceListItem | null }

// Administración › Equipos (Figma 5.4 a 5.8).
function DeviceListPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [form, setForm] = useState<FormState>({ open: false })
  const { data, isPending, isError, refetch } = useDeviceList(filters)

  function updateFilters(changes: Partial<DeviceListFilters>) {
    // Cualquier cambio de filtro vuelve a la primera página.
    setFilters((current) => ({ ...current, page: 1, ...changes }))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-10 items-center justify-between">
        <h1 className="text-2xl font-semibold">Equipos</h1>
        <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, device: null })}>
          Nuevo equipo
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <DeviceFilters filters={filters} onChange={updateFilters} />
        <p className="text-text-muted">Ordenado por: Riesgo (mayor primero)</p>
      </div>

      {isError && !data ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState title="No se pudieron cargar los equipos" onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <TableSkeleton rows={10} columns={8} />
      ) : (
        <DeviceTable
          devices={data.items}
          onEdit={(device) => setForm({ open: true, device })}
          emptyState={
            <EmptyState
              icon={SearchX}
              title="No hay equipos con estos filtros"
              action={<Button onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button>}
            />
          }
          footer={
            data.total > 0 && (
              <Pagination
                page={filters.page}
                pageSize={DEVICE_PAGE_SIZE}
                totalItems={data.total}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            )
          }
        />
      )}

      {form.open && (
        // `key` reinicia el formulario al cambiar de equipo.
        <DeviceFormModal
          key={form.device?.id ?? 'new'}
          device={form.device}
          onClose={() => setForm({ open: false })}
        />
      )}
    </div>
  )
}

export default DeviceListPage
