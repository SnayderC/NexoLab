import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Skeleton from '../../../components/ui/Skeleton'
import { formatDateTime } from '../../../lib/formatDate'
import { formatDuration } from '../../../lib/formatRelative'
import { useIncident } from '../useIncidents'
import DetailField from './DetailField'
import IncidentStatusBadge from './IncidentStatusBadge'
import IncidentSummary from './IncidentSummary'
import VoidIncidentButton from './VoidIncidentButton'

type IncidentDetailModalProps = {
  incidentNumber: string | null
  onClose: () => void
}

// Figma "3.3 Incidencias / Detalle de incidencia cerrada".
function IncidentDetailModal({ incidentNumber, onClose }: IncidentDetailModalProps) {
  const { data: incident } = useIncident(incidentNumber)

  return (
    <Modal
      open={incidentNumber !== null}
      onClose={onClose}
      title="Detalle de incidencia"
      footer={
        <>
          {incidentNumber && <VoidIncidentButton incidentNumber={incidentNumber} onVoided={onClose} />}
          <Button onClick={onClose}>Cerrar</Button>
        </>
      }
    >
      {!incident ? (
        <div className="flex flex-col gap-4" aria-hidden>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">{incident.incident_number}</p>
            <IncidentStatusBadge status={incident.status} />
          </div>
          <IncidentSummary incident={incident} />
          {incident.status === 'CLOSED' && (
            <>
              <DetailField label="Diagnóstico">{incident.diagnosis}</DetailField>
              <div className="flex gap-6">
                <DetailField label="Acción tomada">{incident.resolution_action_name}</DetailField>
                <DetailField label="Fecha y hora de cierre">
                  {incident.closed_at && formatDateTime(incident.closed_at)}
                </DetailField>
              </div>
              {incident.notes && <DetailField label="Observaciones">{incident.notes}</DetailField>}
              <div className="flex gap-6 rounded-lg bg-info-bg p-4">
                <DetailField label="Tiempo de atención">
                  {incident.resolution_time_minutes !== null &&
                    formatDuration(incident.resolution_time_minutes)}
                </DetailField>
                <DetailField label="Cerrada por">{incident.closed_by_name}</DetailField>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}

export default IncidentDetailModal
