import { useState } from 'react'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../components/ui/toast/useToast'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { useVoidIncident } from '../useIncidents'

type VoidIncidentButtonProps = {
  incidentNumber: string
  // Se llama después de anular, para cerrar el modal que contiene el botón.
  onVoided: () => void
}

// "Anular incidencia" (RN-22, D-39): solo el administrador, con confirmación. No está en el Figma;
// usa el botón y el diálogo de peligro de "Retirar equipo" (Figma 5.8).
function VoidIncidentButton({ incidentNumber, onVoided }: VoidIncidentButtonProps) {
  // RN-24: anular es función de administración; no aparece en modo técnico.
  const { canAdminister } = useCurrentUser()
  const { showToast } = useToast()
  const voidIncident = useVoidIncident()
  const [isConfirming, setIsConfirming] = useState(false)

  if (!canAdminister) return null

  function confirm() {
    setIsConfirming(false)
    voidIncident.mutate(incidentNumber, {
      onSuccess: () => {
        onVoided()
        showToast({ message: `Incidencia ${incidentNumber} anulada y riesgo de los equipos actualizado` })
      },
      onError: () => showToast({ message: 'No se pudo anular la incidencia', tone: 'error' }),
    })
  }

  return (
    <div className="mr-auto">
      <Button variant="danger" isLoading={voidIncident.isPending} onClick={() => setIsConfirming(true)}>
        Anular incidencia
      </Button>
      <ConfirmDialog
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={confirm}
        title="Anular incidencia"
        message={`La incidencia ${incidentNumber} dejará de aparecer en la lista y de contar para el riesgo y los indicadores. Úsalo solo si se registró por error. No se puede deshacer.`}
        confirmLabel="Anular incidencia"
        variant="danger"
      />
    </div>
  )
}

export default VoidIncidentButton
