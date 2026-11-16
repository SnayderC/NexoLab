import { useState } from 'react'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../components/ui/toast/useToast'
import { DeviceHasIncidentsError, type DeviceListItem } from '../api'
import { useVoidDevice } from '../useDevices'

type VoidDeviceButtonProps = {
  device: DeviceListItem
  // Se llama después de anular, para cerrar el modal que contiene el botón.
  onVoided: () => void
}

// "Anular equipo" (RN-26, D-56): para un equipo registrado por error y sin incidencias. Con historial, el equipo
// se retira. No está en el Figma: usa el botón y el diálogo de peligro de "Anular incidencia" (D-39).
function VoidDeviceButton({ device, onVoided }: VoidDeviceButtonProps) {
  const { showToast } = useToast()
  const voidDevice = useVoidDevice()
  const [isConfirming, setIsConfirming] = useState(false)

  if (device.incident_count > 0) return null

  function confirm() {
    setIsConfirming(false)
    voidDevice.mutate(device.id, {
      onSuccess: () => {
        onVoided()
        showToast({ message: `Equipo ${device.code} anulado` })
      },
      onError: (error) =>
        showToast({
          message: error instanceof DeviceHasIncidentsError ? error.message : 'No se pudo anular el equipo',
          tone: 'error',
        }),
    })
  }

  return (
    <div className="mr-auto">
      <Button variant="danger" isLoading={voidDevice.isPending} onClick={() => setIsConfirming(true)}>
        Anular equipo
      </Button>
      <ConfirmDialog
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={confirm}
        title="Anular equipo"
        message={`El equipo ${device.code} dejará de aparecer en el sistema. Úsalo solo si se registró por error; su código no se podrá volver a usar. No se puede deshacer.`}
        confirmLabel="Anular equipo"
        variant="danger"
      />
    </div>
  )
}

export default VoidDeviceButton
