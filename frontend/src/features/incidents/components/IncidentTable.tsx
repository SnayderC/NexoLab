import type { ReactNode } from 'react'
import { Link } from 'react-router'
import Button from '../../../components/ui/Button'
import PriorityBadge from '../../../components/ui/PriorityBadge'
import Table, { type TableColumn } from '../../../components/ui/Table'
import { formatDate, formatTime } from '../../../lib/formatDate'
import { formatDuration, formatElapsedLong } from '../../../lib/formatRelative'
import type { IncidentListItem, IncidentStatusFilter } from '../api'
import IncidentStatusBadge from './IncidentStatusBadge'

type IncidentTableProps = {
  incidents: IncidentListItem[]
  status: IncidentStatusFilter
  now: string
  // Incidencia recién registrada, que se resalta (Figma 3.7).
  highlightedNumber: string | null
  // Sin esta función (administrador en su modo normal, RN-24) las abiertas solo se pueden ver.
  onCloseIncident?: (incidentNumber: string) => void
  onViewIncident: (incidentNumber: string) => void
  emptyState: ReactNode
  footer: ReactNode
}

function IncidentTable({
  incidents,
  status,
  now,
  highlightedNumber,
  onCloseIncident,
  onViewIncident,
  emptyState,
  footer,
}: IncidentTableProps) {
  // Anchos del Figma 3.0 más el relleno de la celda (12 px por lado).
  const columns: TableColumn<IncidentListItem>[] = [
    { key: 'number', header: 'N.º', className: 'w-29 whitespace-nowrap', render: (incident) => incident.incident_number },
    {
      key: 'device',
      header: 'Equipo',
      className: 'w-29.5 whitespace-nowrap',
      render: (incident) => (
        <Link to={`/equipos/${incident.device_code}`} className="text-primary hover:underline">
          {incident.device_code}
        </Link>
      ),
    },
    { key: 'laboratory', header: 'Laboratorio', className: 'w-23', render: (incident) => incident.laboratory_code },
    { key: 'component', header: 'Componente', className: 'w-24', render: (incident) => incident.component_name },
    {
      key: 'priority',
      header: 'Prioridad',
      className: 'w-19',
      render: (incident) => <PriorityBadge priority={incident.priority} />,
    },
    {
      key: 'status',
      header: 'Estado',
      className: 'w-22',
      render: (incident) => <IncidentStatusBadge status={incident.status} />,
    },
    {
      key: 'opened_at',
      header: 'Fecha de la falla',
      className: 'w-30',
      render: (incident) => (
        <>
          {formatDate(incident.opened_at)}
          <br />
          {formatTime(incident.opened_at)}
        </>
      ),
    },
    {
      key: 'time',
      header: 'Tiempo de atención',
      className: 'w-32.5',
      // Abierta: tiempo transcurrido desde la falla. Cerrada: duración de la atención.
      render: (incident) =>
        incident.status === 'OPEN'
          ? formatElapsedLong(incident.opened_at, now)
          : incident.resolution_time_minutes !== null && formatDuration(incident.resolution_time_minutes),
    },
    { key: 'reported_by', header: 'Registrada por', className: 'w-28', render: (incident) => incident.reported_by_name },
    { key: 'closed_by', header: 'Cerrada por', className: 'w-26', render: (incident) => incident.closed_by_name },
    ...(status === 'OPEN'
      ? []
      : [
          {
            key: 'result',
            header: 'Resultado',
            className: 'w-28',
            render: (incident: IncidentListItem) => incident.resolution_action_name,
          },
        ]),
    {
      key: 'action',
      header: 'Acción',
      className: 'w-19',
      render: (incident) =>
        incident.status === 'OPEN' && onCloseIncident ? (
          <Button size="sm" onClick={() => onCloseIncident(incident.incident_number)}>
            Cerrar
          </Button>
        ) : (
          <Button size="sm" onClick={() => onViewIncident(incident.incident_number)}>
            Ver
          </Button>
        ),
    },
  ]

  return (
    <Table
      caption="Lista de incidencias"
      tabletMinWidthClass="max-desktop:min-w-240"
      columns={columns}
      rows={incidents}
      getRowKey={(incident) => incident.id}
      getRowClassName={(incident) => (incident.incident_number === highlightedNumber ? 'bg-info-bg' : '')}
      emptyState={emptyState}
      footer={footer}
    />
  )
}

export default IncidentTable
