import { Clock, Monitor, Plus, TriangleAlert, Zap } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '../../../components/ui/Button'
import ErrorState from '../../../components/ui/ErrorState'
import { useToast } from '../../../components/ui/toast/useToast'
import { useCurrentUser } from '../../auth/useCurrentUser'
import type { DashboardFilters as Filters } from '../api'
import TableSkeleton from '../../../components/ui/TableSkeleton'
import { BannerSkeleton, KpiRowSkeleton, RiskColumnsSkeleton } from '../components/DashboardSkeleton'
import DashboardFilters from '../components/DashboardFilters'
import KpiCard from '../components/KpiCard'
import OpenIncidentsTable from '../components/OpenIncidentsTable'
import RiskAnalysisBanner from '../components/RiskAnalysisBanner'
import RiskColumn from '../components/RiskColumn'
import { useDashboardSummary, useRecalculateRisk } from '../useDashboard'

function DashboardPage() {
  const navigate = useNavigate()
  const { isAdmin } = useCurrentUser()
  const { showToast } = useToast()
  const [filters, setFilters] = useState<Filters>({ laboratory_id: null, device_type_id: null })
  const { data: summary, isPending, isError, refetch } = useDashboardSummary(filters)
  const recalculate = useRecalculateRisk()

  function handleRecalculate() {
    recalculate.mutate(undefined, {
      onSuccess: (counts) =>
        showToast({
          message: `Riesgo actualizado: ${counts.HIGH} alto · ${counts.MEDIUM} medio · ${counts.LOW} bajo`,
        }),
      onError: () => showToast({ message: 'No se pudo recalcular el riesgo', tone: 'error' }),
    })
  }

  const highRiskGroup = summary?.risk_groups.find((group) => group.risk_level.code === 'HIGH')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-10 items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard de riesgo</h1>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/incidencias/nueva')}>
          Registrar incidencia
        </Button>
      </div>

      {isError && !summary ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState
            title="No se pudo cargar el dashboard"
            onRetry={() => refetch()}
          />
        </div>
      ) : (
        <>
          {isPending ? (
            <>
              <KpiRowSkeleton />
              <BannerSkeleton />
            </>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4">
                <KpiCard
                  icon={TriangleAlert}
                  tone="danger"
                  title="Incidencias abiertas"
                  value={String(summary.indicators.open_incident_count)}
                  detail={`${summary.indicators.open_high_priority_count} de prioridad alta`}
                />
                <KpiCard
                  icon={Clock}
                  tone="info"
                  title="Tiempo promedio de atención"
                  value={`${summary.indicators.avg_resolution_minutes} min`}
                  detail="Últimos 30 días"
                />
                <KpiCard
                  icon={Zap}
                  tone="warning"
                  title="Equipos en riesgo alto"
                  value={String(summary.indicators.high_risk_device_count)}
                  detail={highRiskGroup?.risk_level.recommended_action ?? ''}
                />
                <KpiCard
                  icon={Monitor}
                  tone="success"
                  title="Equipos activos"
                  value={String(summary.indicators.active_device_count)}
                  detail="Bloque H"
                />
              </div>
              <RiskAnalysisBanner
                lastRun={summary.last_run}
                canRecalculate={isAdmin}
                isRecalculating={recalculate.isPending}
                onRecalculate={handleRecalculate}
              />
            </>
          )}

          <DashboardFilters filters={filters} onChange={setFilters} />

          {isPending ? (
            <>
              <RiskColumnsSkeleton />
              <TableSkeleton withTitle />
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                {summary.risk_groups.map((group) => (
                  <RiskColumn key={group.risk_level.code} group={group} />
                ))}
              </div>
              <OpenIncidentsTable incidents={summary.open_incidents} now={summary.generated_at} />
            </>
          )}
        </>
      )}
    </div>
  )
}

export default DashboardPage
