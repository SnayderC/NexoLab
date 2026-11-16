import { ClipboardCheck } from 'lucide-react'
import { useNavigate } from 'react-router'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import PriorityBadge from '../../../components/ui/PriorityBadge'
import Table, { type TableColumn } from '../../../components/ui/Table'
import { formatElapsed } from '../../../lib/formatRelative'
import type { OpenIncidentItem } from '../api'

type OpenIncidentsTableProps = {
  incidents: OpenIncidentItem[]
  // Referencia para "hace 1 h".
  now: string
  // RN-24: el administrador en su modo normal solo ve el detalle.
  canClose: boolean
}

function OpenIncidentsTable({ incidents, now, canClose }: OpenIncidentsTableProps) {
  const navigate = useNavigate()

  const columns: TableColumn<OpenIncidentItem>[] = [
    { key: 'number', header: 'N.º', className: 'w-45 whitespace-nowrap', render: (incident) => incident.incident_number },
    { key: 'device', header: 'Equipo', className: 'w-45 whitespace-nowrap', render: (incident) => incident.device_code },
    { key: 'component', header: 'Componente', className: 'w-42.5', render: (incident) => incident.component_name },
    {
      key: 'priority',
      header: 'Prioridad',
      className: 'w-35',
      render: (incident) => <PriorityBadge priority={incident.priority} />,
    },
    { key: 'elapsed', header: 'Tiempo transcurrido', render: (incident) => formatElapsed(incident.opened_at, now) },
    {
      key: 'action',
      header: '',
      className: 'w-20',
      // Los modales "Cerrar incidencia" y "Detalle" viven sobre /incidencias (sección 12).
      render: (incident) => (
        <Button
          size="sm"
          className="w-17.5"
          onClick={() => navigate(`/incidencias?${canClose ? 'cerrar' : 'ver'}=${incident.incident_number}`)}
        >
          {canClose ? 'Cerrar' : 'Ver'}
        </Button>
      ),
    },
  ]

  return (
    <Table
      title="Incidencias abiertas"
      caption="Incidencias abiertas"
      variant="compact"
      columns={columns}
      rows={incidents}
      getRowKey={(incident) => incident.id}
      emptyState={<EmptyState icon={ClipboardCheck} title="No hay incidencias abiertas" />}
    />
  )
}

export default OpenIncidentsTable
