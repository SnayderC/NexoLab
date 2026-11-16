import { Monitor } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import { formatDate } from '../../../lib/formatDate'
import DeviceRiskCard from '../../devices/components/DeviceRiskCard'
import { useDeviceInfo } from '../useDeviceInfo'
import DetailField from './DetailField'
import IncidentStatusBadge from './IncidentStatusBadge'

// Panel derecho de "Registrar incidencia" (Figma 3.4 y 3.5).
function DeviceInfoPanel({ deviceCode }: { deviceCode: string | null }) {
  const { data: device, isPending } = useDeviceInfo(deviceCode)

  return (
    <aside className="flex w-full shrink-0 lg:w-95 flex-col gap-5 self-start rounded-lg border border-border-subtle bg-surface p-5">
      <h2 className="text-base font-semibold">Información del equipo</h2>

      {deviceCode === null ? (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
          <Monitor className="size-7 text-text-muted" aria-hidden />
          <p className="text-text-muted">Selecciona un equipo para ver su información</p>
        </div>
      ) : isPending || !device ? (
        <div className="flex flex-col gap-4" aria-hidden>
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : (
        <>
          {device.risk && <DeviceRiskCard device={device.risk} badgeFormat="long" />}

          <div className="flex gap-4">
            <DetailField label="Laboratorio">{device.laboratory_code}</DetailField>
            <DetailField label="Ubicación">{device.physical_location ?? '—'}</DetailField>
          </div>
          <DetailField label="Especificaciones">{device.specifications ?? '—'}</DetailField>
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Estado</span>
            <Badge tone={device.status === 'ACTIVE' ? 'success' : 'neutral'}>{device.status_name}</Badge>
          </div>

          <div className="flex flex-col gap-4 border-t border-border-subtle pt-5">
            <h3 className="font-semibold">Últimas {device.recent_incidents.length || ''} incidencias</h3>
            {device.recent_incidents.length === 0 ? (
              <p className="text-xs text-text-muted">Este equipo no tiene incidencias registradas.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {device.recent_incidents.map((incident) => (
                  <li
                    key={incident.incident_number}
                    className="flex flex-col gap-2 border-b border-border-subtle pb-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{incident.incident_number}</span>
                      <IncidentStatusBadge status={incident.status} />
                    </div>
                    <p className="text-xs text-text-muted">
                      {incident.component_name} · {formatDate(incident.opened_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </aside>
  )
}

export default DeviceInfoPanel
