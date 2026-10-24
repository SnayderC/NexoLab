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
}

function OpenIncidentsTable({ incidents, now }: OpenIncidentsTableProps) {
  const navigate = useNavigate()

  const columns: TableColumn<OpenIncidentItem>[] = [
    { key: 'number', header: 'N.º', className: 'w-45', render: (incident) => incident.incident_number },
    { key: 'device', header: 'Equipo', className: 'w-45', render: (incident) => incident.device_code },
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
      // El modal "Cerrar incidencia" vive sobre /incidencias (sección 12).
      render: (incident) => (
        <Button
          size="sm"
          className="w-17.5"
          onClick={() => navigate(`/incidencias?cerrar=${incident.incident_number}`)}
        >
          Cerrar
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
