import { Plus } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import type { DeviceHistory } from '../api'

type DeviceHeaderProps = {
  device: DeviceHistory
  // Sin esta función (administrador en su modo normal, RN-24) no se muestra el botón.
  onRegisterIncident?: () => void
}

// Encabezado del historial (Figma 4.0 "Activo" y 4.2 "Retirado").
function DeviceHeader({ device, onRegisterIncident }: DeviceHeaderProps) {
  const isRetired = device.status === 'RETIRED'

  return (
    <section className="flex flex-col gap-6 rounded-lg lg:flex-row lg:items-center border border-border-subtle bg-surface p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-text-muted">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text">{device.code}</h1>
          <Badge tone={isRetired ? 'neutral' : 'success'}>{device.status_name}</Badge>
        </div>
        <p className="flex gap-3">
          <span>{device.type_name}</span>
          <span>Laboratorio {device.laboratory_code}</span>
        </p>
        {device.physical_location && <p className="leading-5">{device.physical_location}</p>}
        {device.specifications && <p className="leading-5">{device.specifications}</p>}
      </div>

      {onRegisterIncident && (
        <div className="flex w-full shrink-0 flex-col items-end gap-2 lg:w-90">
          {/* RN-13: no se registran incidencias en equipos retirados. */}
          <Button
            variant="primary"
            icon={isRetired ? undefined : Plus}
            disabled={isRetired}
            onClick={onRegisterIncident}
            className="w-full"
          >
            {isRetired ? '+ Registrar incidencia para este equipo' : 'Registrar incidencia para este equipo'}
          </Button>
          {isRetired && (
            <p className="text-right text-xs leading-4.5 text-text-muted">
              No se pueden registrar incidencias en equipos retirados
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export default DeviceHeader
