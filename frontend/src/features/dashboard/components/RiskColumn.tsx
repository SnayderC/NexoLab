import { useState } from 'react'
import { formatDecimal } from '../../../lib/formatNumber'
import type { RiskGroup } from '../api'
import DeviceRiskCard from '../../devices/components/DeviceRiskCard'
import { CARD_LIMIT, riskStyles } from '../../devices/components/riskStyles'

// Columna de un nivel de riesgo: cabecera con el perfil del grupo y sus equipos.
function RiskColumn({ group }: { group: RiskGroup }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const level = group.risk_level.code
  const styles = riskStyles[level]
  const total = group.devices.length
  const visibleDevices = isExpanded ? group.devices : group.devices.slice(0, CARD_LIMIT[level])

  return (
    <section
      aria-label={group.risk_level.name}
      className={`flex flex-col gap-3 rounded-lg p-3 ${styles.bg}`}
    >
      <header className="flex flex-col gap-1.5">
        <div className="flex h-6 items-center gap-2">
          <span className={`size-2 rounded-full ${styles.solid}`} aria-hidden />
          <h2 className={`font-semibold ${styles.text}`}>{group.risk_level.name}</h2>
          <span
            className={`flex h-6 min-w-7 items-center justify-center rounded-full bg-surface px-2 text-xs font-semibold ${styles.text}`}
          >
            {total}
          </span>
        </div>
        <p className={`text-xs leading-4.5 font-medium ${styles.text}`}>{group.risk_level.recommended_action}</p>
        <p className="text-xs leading-4.5 text-text-muted">
          Promedio: {formatDecimal(group.avg_incident_count)} incidencias · última falla hace{' '}
          {formatDecimal(group.avg_days_since_last_failure)} días · falla cada{' '}
          {formatDecimal(group.avg_failure_interval_days)} días
        </p>
      </header>

      {total === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted">Sin equipos en este nivel</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleDevices.map((device) => (
            <DeviceRiskCard key={device.device_code} device={device} />
          ))}
        </div>
      )}

      {total > CARD_LIMIT[level] && (
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          className="flex h-8 items-center justify-center rounded-md text-xs font-medium text-nav-active hover:underline"
        >
          {isExpanded ? 'Ver menos' : `Ver los ${total} equipos`}
        </button>
      )}
    </section>
  )
}

export default RiskColumn
