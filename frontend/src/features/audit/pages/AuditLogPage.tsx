import { History } from 'lucide-react'
import { useState } from 'react'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Input from '../../../components/ui/Input'
import Pagination from '../../../components/ui/Pagination'
import Select from '../../../components/ui/Select'
import Table, { type TableColumn } from '../../../components/ui/Table'
import TableSkeleton from '../../../components/ui/TableSkeleton'
import { formatDate, formatTime } from '../../../lib/formatDate'
import type { AuditEntityType, AuditLog } from '../../../types/audit'
import { useUsers } from '../../users/useUsers'
import { AUDIT_PAGE_SIZE, type AuditLogFilters } from '../api'
import AuditChanges from '../components/AuditChanges'
import { useAuditLogs } from '../useAuditLogs'

const ALL = 'ALL'

const initialFilters: AuditLogFilters = { entity_type: null, user_id: null, from: null, to: null, page: 1 }

const columns: TableColumn<AuditLog>[] = [
  {
    key: 'date',
    header: 'Fecha y hora',
    className: 'w-28 whitespace-nowrap',
    render: (log) => (
      <>
        {formatDate(log.created_at)}
        <br />
        {formatTime(log.created_at)}
      </>
    ),
  },
  { key: 'user', header: 'Usuario', className: 'w-36', render: (log) => log.user_name },
  { key: 'action', header: 'Acción', className: 'w-44', render: (log) => log.action_name },
  {
    key: 'entity',
    header: 'Elemento',
    className: 'w-44',
    render: (log) => (
      <>
        <span className="text-text-muted">{log.entity_type_name}</span>
        <br />
        {log.entity_label}
      </>
    ),
  },
  { key: 'changes', header: 'Cambios', render: (log) => <AuditChanges changes={log.changes} /> },
]

// Administración › Bitácora (D-52): quién cambió qué en usuarios, laboratorios, equipos, catálogo e incidencias.
// No está en el Figma: usa la tabla, los filtros y la paginación de las demás pantallas de administración.
function AuditLogPage() {
  const [filters, setFilters] = useState(initialFilters)
  const { data, isPending, isError, refetch } = useAuditLogs(filters)
  const users = useUsers()

  function update(changes: Partial<AuditLogFilters>) {
    setFilters((current) => ({ ...current, page: 1, ...changes }))
  }

  const entityOptions = [
    { value: ALL, label: 'Todos' },
    ...(data?.entity_types ?? []).map((type) => ({ value: type.value, label: type.label })),
  ]
  const userOptions = [
    { value: ALL, label: 'Todos' },
    ...(users.data ?? []).map((user) => ({ value: String(user.id), label: `${user.first_name} ${user.last_name}` })),
  ]
  const hasFilters = filters.entity_type !== null || filters.user_id !== null || filters.from !== null || filters.to !== null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Bitácora</h1>
        <p className="text-text-muted">
          Cambios hechos en usuarios, laboratorios, equipos, catálogo e incidencias, del más reciente al más antiguo.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-60">
          <Select
            options={entityOptions}
            value={filters.entity_type ?? ALL}
            onChange={(value) => update({ entity_type: value === ALL ? null : (value as AuditEntityType) })}
            valuePrefix="Elemento:"
            aria-label="Filtrar por tipo de elemento"
          />
        </div>
        <div className="w-60">
          <Select
            options={userOptions}
            value={filters.user_id === null ? ALL : String(filters.user_id)}
            onChange={(value) => update({ user_id: value === ALL ? null : Number(value) })}
            valuePrefix="Usuario:"
            aria-label="Filtrar por usuario"
          />
        </div>
        <div className="w-36">
          <Input
            type="date"
            aria-label="Desde"
            title="Desde"
            value={filters.from ?? ''}
            max={filters.to ?? undefined}
            onChange={(event) => update({ from: event.target.value || null })}
          />
        </div>
        <div className="w-36">
          <Input
            type="date"
            aria-label="Hasta"
            title="Hasta"
            value={filters.to ?? ''}
            min={filters.from ?? undefined}
            onChange={(event) => update({ to: event.target.value || null })}
          />
        </div>
      </div>

      {isError && !data ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState title="No se pudo cargar la bitácora" onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <TableSkeleton rows={8} columns={5} />
      ) : (
        <Table
          caption="Bitácora de cambios administrativos"
          columns={columns}
          rows={data.items}
          getRowKey={(log) => log.id}
          emptyState={
            <EmptyState
              icon={History}
              title={hasFilters ? 'No hay cambios con estos filtros' : 'Todavía no hay cambios registrados'}
              action={hasFilters && <Button onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button>}
            />
          }
          footer={
            data.total > 0 && (
              <Pagination
                page={filters.page}
                pageSize={AUDIT_PAGE_SIZE}
                totalItems={data.total}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            )
          }
        />
      )}
    </div>
  )
}

export default AuditLogPage
