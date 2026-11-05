import { CheckCircle2, Clock, ClipboardList, MonitorX } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import ErrorState from '../../../components/ui/ErrorState'
import RiskBadge from '../../../components/ui/RiskBadge'
import Table, { type TableColumn } from '../../../components/ui/Table'
import TableSkeleton from '../../../components/ui/TableSkeleton'
import { toDateInputValue } from '../../../lib/formatDate'
import { formatDecimal } from '../../../lib/formatNumber'
import { formatDuration } from '../../../lib/formatRelative'
import type { Priority } from '../../../types/incident'
import { KpiRowSkeleton } from '../../dashboard/components/DashboardSkeleton'
import KpiCard from '../../dashboard/components/KpiCard'
import type { ReportFilters as Filters, TechnicianRow, TopDevice } from '../api'
import BarListCard from '../components/BarListCard'
import ReportFilters from '../components/ReportFilters'
import { useReportSummary } from '../useReports'

const DEFAULT_PERIOD_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

const priorityBars: Record<Priority, { label: string; barClassName: string }> = {
  HIGH: { label: 'Alta', barClassName: 'bg-risk-high' },
  MEDIUM: { label: 'Media', barClassName: 'bg-risk-medium' },
  LOW: { label: 'Baja', barClassName: 'bg-risk-low' },
}

const MINUTES_PER_DAY = 24 * 60

const minutesOrDash = (minutes: number | null) => (minutes === null ? '—' : formatDuration(minutes))

// En la tarjeta, un promedio de más de un día se muestra en días ("1,5 días") para que quepa.
function formatAverage(minutes: number | null): string {
  if (minutes === null) return '—'
  return minutes >= MINUTES_PER_DAY ? `${formatDecimal(minutes / MINUTES_PER_DAY)} días` : formatDuration(minutes)
}

const technicianColumns: TableColumn<TechnicianRow>[] = [
  { key: 'name', header: 'Técnico', render: (row) => row.name },
  { key: 'registered', header: 'Registradas', className: 'w-32', render: (row) => row.registered_count },
  { key: 'closed', header: 'Cerradas', className: 'w-32', render: (row) => row.closed_count },
  {
    key: 'avg',
    header: 'Tiempo promedio de atención',
    className: 'w-52',
    render: (row) => minutesOrDash(row.avg_resolution_minutes),
  },
]

const deviceColumns: TableColumn<TopDevice>[] = [
  {
    key: 'code',
    header: 'Equipo',
    render: (device) => (
      <Link to={`/equipos/${device.code}`} className="text-primary hover:underline">
        {device.code}
      </Link>
    ),
  },
  { key: 'type', header: 'Tipo', render: (device) => device.type_name },
  { key: 'lab', header: 'Laboratorio', className: 'w-28', render: (device) => device.laboratory_code },
  { key: 'count', header: 'Incidencias', className: 'w-28', render: (device) => device.incident_count },
  {
    key: 'risk',
    header: 'Riesgo actual',
    className: 'w-32',
    render: (device) =>
      device.risk_level ? <RiskBadge level={device.risk_level} /> : <span className="text-text-muted">Retirado</span>,
  },
]

// Pantalla "Reportes" (D-40). No está en el Figma: usa sus tarjetas, tablas y colores.
function ReportsPage() {
  const [filters, setFilters] = useState<Filters>(() => {
    const today = new Date()
    return {
      from: toDateInputValue(new Date(today.getTime() - (DEFAULT_PERIOD_DAYS - 1) * DAY_MS)),
      to: toDateInputValue(today),
      laboratory_id: null,
    }
  })
  const { data: report, isPending, isError, refetch } = useReportSummary(filters)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-10 items-center justify-between">
        <h1 className="text-2xl font-semibold">Reportes</h1>
      </div>
      <ReportFilters filters={filters} onChange={(changes) => setFilters((current) => ({ ...current, ...changes }))} />

      {isError && !report ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState title="No se pudo cargar el reporte" onRetry={() => refetch()} />
        </div>
      ) : isPending || !report ? (
        <>
          <KpiRowSkeleton />
          <TableSkeleton />
        </>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              icon={ClipboardList}
              tone="info"
              title="Incidencias registradas"
              value={String(report.indicators.registered_count)}
              detail="Fallas ocurridas en el periodo"
            />
            <KpiCard
              icon={CheckCircle2}
              tone="success"
              title="Incidencias cerradas"
              value={String(report.indicators.closed_count)}
              detail="Cerradas en el periodo"
            />
            <KpiCard
              icon={Clock}
              tone="warning"
              title="Tiempo promedio de atención"
              value={formatAverage(report.indicators.avg_resolution_minutes)}
              detail="De las cerradas en el periodo"
            />
            <KpiCard
              icon={MonitorX}
              tone="danger"
              title="Equipos retirados"
              value={String(report.indicators.retired_device_count)}
              detail="Retirados en el periodo"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <BarListCard
              title="Incidencias por laboratorio"
              rows={report.by_laboratory.map((row) => ({ key: row.id, label: row.label, count: row.count }))}
            />
            <BarListCard
              title="Incidencias por componente"
              rows={report.by_component.map((row) => ({ key: row.id, label: row.label, count: row.count }))}
            />
            <BarListCard
              title="Incidencias por prioridad"
              rows={report.by_priority.map((row) => ({ key: row.priority, count: row.count, ...priorityBars[row.priority] }))}
            />
          </div>

          <Table
            title="Atención por técnico"
            caption="Incidencias registradas y cerradas por cada técnico en el periodo"
            columns={technicianColumns}
            rows={report.by_technician}
            getRowKey={(row) => row.id}
            emptyState={<p className="py-6 text-center text-xs text-text-muted">Sin actividad en el periodo</p>}
          />

          <Table
            title="Equipos con más incidencias"
            caption="Los 10 equipos con más incidencias en el periodo"
            columns={deviceColumns}
            rows={report.top_devices}
            getRowKey={(device) => device.code}
            emptyState={<p className="py-6 text-center text-xs text-text-muted">Sin incidencias en el periodo</p>}
          />
        </>
      )}
    </div>
  )
}

export default ReportsPage
