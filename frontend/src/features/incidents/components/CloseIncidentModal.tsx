import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Skeleton from '../../../components/ui/Skeleton'
import { useToast } from '../../../components/ui/toast/useToast'
import { useCurrentUser } from '../../auth/useCurrentUser'
import type { CloseIncidentInput } from '../api'
import { useCloseIncident, useIncident } from '../useIncidents'
import CloseIncidentForm, { CLOSE_INCIDENT_FORM_ID } from './CloseIncidentForm'
import IncidentSummary from './IncidentSummary'

type CloseIncidentModalProps = {
  incidentNumber: string | null
  onClose: () => void
}

function CloseIncidentModal({ incidentNumber, onClose }: CloseIncidentModalProps) {
  const { user } = useCurrentUser()
  const { showToast } = useToast()
  const { data: incident } = useIncident(incidentNumber)
  const closeIncident = useCloseIncident()
  // Solo se cierran incidencias abiertas (RN-21: una cerrada ya no se modifica).
  const canClose = incident?.status === 'OPEN'

  function handleSubmit(input: CloseIncidentInput) {
    if (!incidentNumber) return
    closeIncident.mutate(
      { incidentNumber, input },
      {
        onSuccess: () => {
          onClose()
          showToast({ message: 'Incidencia cerrada. Actualizando el riesgo de los equipos…', tone: 'info' })
        },
        onError: () => showToast({ message: 'No se pudo cerrar la incidencia', tone: 'error' }),
      },
    )
  }

  return (
    <Modal
      open={incidentNumber !== null}
      onClose={onClose}
      title="Cerrar incidencia"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            form={CLOSE_INCIDENT_FORM_ID}
            variant="primary"
            disabled={!canClose}
            isLoading={closeIncident.isPending}
          >
            Cerrar incidencia
          </Button>
        </>
      }
    >
      {!incident ? (
        <div className="flex flex-col gap-4" aria-hidden>
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <IncidentSummary incident={incident} />
          {canClose ? (
            // `key` reinicia el formulario al abrir otra incidencia.
            <CloseIncidentForm
              key={incident.incident_number}
              incident={incident}
              closedByName={`${user.first_name} ${user.last_name}`}
              onSubmit={handleSubmit}
            />
          ) : (
            <p className="text-text-muted">Esta incidencia ya está cerrada.</p>
          )}
        </>
      )}
    </Modal>
  )
}

export default CloseIncidentModal
