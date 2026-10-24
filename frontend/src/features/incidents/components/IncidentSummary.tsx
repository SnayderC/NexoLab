import PriorityBadge from '../../../components/ui/PriorityBadge'
import { formatDateTime } from '../../../lib/formatDate'
import type { IncidentDetail } from '../api'
import DetailField from './DetailField'

// Recuadro gris con los datos de la incidencia (modales de detalle y de cierre).
function IncidentSummary({ incident }: { incident: IncidentDetail }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-background p-5">
      <div className="flex gap-5">
        <DetailField label="N.º">{incident.incident_number}</DetailField>
        <DetailField label="Equipo">{incident.device_code}</DetailField>
        <DetailField label="Componente">{incident.component_name}</DetailField>
      </div>
      <div className="flex gap-5">
        <DetailField label="Prioridad">
          <PriorityBadge priority={incident.priority} />
        </DetailField>
        <DetailField label="Fecha de la falla">{formatDateTime(incident.opened_at)}</DetailField>
        <DetailField label="Registrada por">{incident.reported_by_name}</DetailField>
      </div>
      <DetailField label="Descripción">{incident.description}</DetailField>
    </div>
  )
}

export default IncidentSummary
