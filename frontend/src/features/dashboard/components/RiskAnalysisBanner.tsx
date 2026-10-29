import { RefreshCw, Sparkles } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { formatDateTime } from '../../../lib/formatDate'
import type { DashboardSummary } from '../api'

type RiskAnalysisBannerProps = {
  lastRun: DashboardSummary['last_run']
  // Solo el administrador puede recalcular (sección 3).
  canRecalculate: boolean
  isRecalculating: boolean
  onRecalculate: () => void
}

function RiskAnalysisBanner({ lastRun, canRecalculate, isRecalculating, onRecalculate }: RiskAnalysisBannerProps) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-lg border border-info-border bg-info-bg px-4 py-3">
      <Sparkles className="size-5 shrink-0 text-primary" aria-hidden />
      <p className="flex-1 leading-5 text-info-text">
        {lastRun
          ? `Riesgo actualizado el ${formatDateTime(lastRun.finished_at)} · ${lastRun.kmeans_device_count} equipos analizados por K-Means · ${lastRun.insufficient_history_count} sin historial suficiente`
          : 'El riesgo todavía no se ha calculado'}
      </p>
      {canRecalculate && (
        <Button
          variant="info"
          size="sm"
          icon={RefreshCw}
          isLoading={isRecalculating}
          onClick={onRecalculate}
          className="w-41.5"
        >
          Recalcular ahora
        </Button>
      )}
    </div>
  )
}

export default RiskAnalysisBanner
