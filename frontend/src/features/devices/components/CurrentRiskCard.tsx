import Badge from '../../../components/ui/Badge'
import RiskBadge from '../../../components/ui/RiskBadge'
import { formatDateTime } from '../../../lib/formatDate'
import { formatDecimal } from '../../../lib/formatNumber'
import { formatDays, formatDaysAgo } from '../../../lib/formatRelative'
import type { DeviceHistory } from '../api'
import { riskStyles } from './riskStyles'

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-background p-3">
      <p className="text-2xl leading-7 font-semibold">{value}</p>
      <p className="text-xs leading-4.5 text-text-muted">{label}</p>
    </div>
  )
}

type CurrentRiskCardProps = {
  risk: NonNullable<DeviceHistory['current_risk']>
}

// Tarjeta "Riesgo actual" del Figma 4.0 (K-Means) y 4.1 (sin historial suficiente).
function CurrentRiskCard({ risk }: CurrentRiskCardProps) {
  const level = risk.risk_level
  const hasHistory = risk.classification_method === 'KMEANS'

  return (
    <section className="flex min-h-80 flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-6">
      <h2 className="text-base font-semibold">Riesgo actual</h2>
      <div className="flex items-center gap-3">
        <RiskBadge level={level} format="long" />
        <p className={`font-medium ${riskStyles[level].text}`}>{risk.risk_level_info.recommended_action}</p>
      </div>

      {hasHistory ? (
        <>
          <div className="flex gap-3">
            <Metric value={String(risk.incident_count)} label="Incidencias" />
            <Metric
              value={risk.days_since_last_failure !== null ? formatDaysAgo(risk.days_since_last_failure) : '—'}
              label="Última falla"
            />
            <Metric
              value={risk.avg_failure_interval_days !== null ? formatDays(risk.avg_failure_interval_days) : '—'}
              label="Falla cada"
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <p>Método: K-Means</p>
            <p>Calculado el {formatDateTime(risk.calculated_at)}</p>
          </div>
          {risk.group_average && (
            <p className="text-xs leading-4.5 text-text-muted">
              Promedio del grupo de {risk.risk_level_info.name.toLowerCase()}:{' '}
              {formatDecimal(risk.group_average.incident_count)} incidencias ·{' '}
              {formatDays(risk.group_average.days_since_last_failure)} ·{' '}
              {formatDays(risk.group_average.failure_interval_days)}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex">
            <Metric value={String(risk.incident_count)} label="Incidencias" />
          </div>
          <div>
            <Badge tone="neutral">Sin historial suficiente</Badge>
          </div>
          {/* RN-23: menos de 2 incidencias → riesgo bajo por regla, sin K-Means. */}
          <p className="leading-5 text-text-muted">
            Este equipo tiene menos de 2 incidencias registradas. Se clasifica como riesgo bajo hasta que acumule
            historial.
          </p>
        </>
      )}
    </section>
  )
}

export default CurrentRiskCard
