import { Link } from 'react-router'
import RiskBadge from '../../../components/ui/RiskBadge'
import { formatDays, formatDaysAgo } from '../../../lib/formatRelative'
import type { DeviceRiskItem } from '../types'
import { riskStyles } from './riskStyles'

type DeviceRiskCardProps = {
  device: DeviceRiskItem
  // "short" muestra "Alto" (dashboard); "long" muestra "Riesgo alto" (ficha del equipo).
  badgeFormat?: 'short' | 'long'
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="text-2xs leading-4 text-text-muted">{label}</dt>
      <dd className="text-xs leading-4.5 font-medium">{value}</dd>
    </div>
  )
}

// Tarjeta de un equipo dentro de su columna de riesgo. Lleva al historial del equipo.
function DeviceRiskCard({ device, badgeFormat = 'short' }: DeviceRiskCardProps) {
  const level = device.risk_level
  const hasHistory = device.classification_method === 'KMEANS'

  return (
    <Link
      to={`/equipos/${device.device_code}`}
      className="relative block h-32 overflow-hidden rounded-lg border border-border-subtle bg-surface p-3 transition hover:shadow-menu"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${riskStyles[level].solid}`} aria-hidden />
      <div className="flex flex-col gap-2">
        <div className="flex h-5.5 items-center justify-between gap-2">
          <p className="font-semibold">{device.device_code}</p>
          <RiskBadge level={level} format={badgeFormat} />
        </div>
        <p className="text-xs leading-4 text-text-muted">
          {device.laboratory_code} · {device.device_type_name}
        </p>
        {hasHistory ? (
          <dl className="grid grid-cols-3 gap-x-2 gap-y-2">
            <Stat label="Incidencias" value={String(device.incident_count)} />
            <Stat
              label="Última falla"
              value={device.days_since_last_failure !== null ? formatDaysAgo(device.days_since_last_failure) : '—'}
            />
            <Stat
              label="Falla cada"
              value={device.avg_failure_interval_days !== null ? formatDays(device.avg_failure_interval_days) : '—'}
            />
          </dl>
        ) : (
          <div className="flex h-10.5 items-center">
            <span className="flex h-6 items-center rounded bg-neutral-bg px-2 text-xs text-text-muted">
              Sin historial suficiente
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default DeviceRiskCard
