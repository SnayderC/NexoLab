import type { ReactNode } from 'react'
import PriorityBadge from '../../../components/ui/PriorityBadge'
import Table, { type TableColumn } from '../../../components/ui/Table'
import { formatDate, formatTime } from '../../../lib/formatDate'
import { formatDuration, formatElapsedLong } from '../../../lib/formatRelative'
import IncidentStatusBadge from '../../incidents/components/IncidentStatusBadge'
import type { DeviceIncidentItem } from '../api'

type DeviceIncidentsTableProps = {
  incidents: DeviceIncidentItem[]
  now: string
  emptyState: ReactNode
  footer: ReactNode
}

// Tabla "Incidencias del equipo" (Figma 4.0). Anchos del Figma más el relleno de la celda.
function DeviceIncidentsTable({ incidents, now, emptyState, footer }: DeviceIncidentsTableProps) {
  const columns: TableColumn<DeviceIncidentItem>[] = [
    { key: 'number', header: 'N.º', className: 'w-34 whitespace-nowrap', render: (i) => i.incident_number },
    {
      key: 'opened_at',
      header: 'Fecha de la falla',
      className: 'w-30',
      render: (i) => (
        <>
          {formatDate(i.opened_at)}
          <br />
          {formatTime(i.opened_at)}
        </>
      ),
    },
    { key: 'component', header: 'Componente', className: 'w-26', render: (i) => i.component_name },
    { key: 'priority', header: 'Prioridad', className: 'w-21', render: (i) => <PriorityBadge priority={i.priority} /> },
    { key: 'status', header: 'Estado', className: 'w-24', render: (i) => <IncidentStatusBadge status={i.status} /> },
    { key: 'diagnosis', header: 'Diagnóstico', render: (i) => i.diagnosis ?? '—' },
    { key: 'action', header: 'Acción', className: 'w-31', render: (i) => i.resolution_action_name ?? '—' },
    {
      key: 'time',
      header: 'Tiempo de atención',
      className: 'w-26',
      // Abierta: tiempo transcurrido desde la falla. Cerrada: duración de la atención.
      render: (i) =>
        i.status === 'OPEN'
          ? formatElapsedLong(i.opened_at, now)
          : i.resolution_time_minutes !== null && formatDuration(i.resolution_time_minutes),
    },
    { key: 'technician', header: 'Técnico', className: 'w-32', render: (i) => i.technician_name ?? '—' },
  ]

  return (
    <Table
      title="Incidencias del equipo"
      caption="Incidencias del equipo"
      columns={columns}
      rows={incidents}
      getRowKey={(i) => i.id}
      emptyState={emptyState}
      footer={footer}
    />
  )
}

export default DeviceIncidentsTable
