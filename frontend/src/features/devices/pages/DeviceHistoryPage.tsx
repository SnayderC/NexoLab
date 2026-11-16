import { ClipboardList, SearchX } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Notice from '../../../components/ui/Notice'
import Pagination from '../../../components/ui/Pagination'
import TableSkeleton from '../../../components/ui/TableSkeleton'
import { formatDate } from '../../../lib/formatDate'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { DeviceNotFoundError, HISTORY_PAGE_SIZE } from '../api'
import CurrentRiskCard from '../components/CurrentRiskCard'
import DeviceHeader from '../components/DeviceHeader'
import DeviceHistorySkeleton from '../components/DeviceHistorySkeleton'
import DeviceIncidentsTable from '../components/DeviceIncidentsTable'
import RiskEvolutionChart from '../components/RiskEvolutionChart'
import { useDeviceHistory, useDeviceIncidents } from '../useDeviceHistory'

// Historial del equipo (Figma 04 · Equipos): /equipos/:code
function DeviceHistoryPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const history = useDeviceHistory(code)
  const incidents = useDeviceIncidents(code, page)

  const { canOperateIncidents } = useCurrentUser()

  // El formulario de registro abre con este equipo ya elegido. RN-24: no aparece en modo administrador.
  const registerIncident = canOperateIncidents ? () => navigate(`/incidencias/nueva?equipo=${code}`) : undefined

  const breadcrumb = (
    <nav aria-label="Ruta de navegación" className="text-text-muted">
      <Link to="/" className="hover:text-text">
        Dashboard
      </Link>{' '}
      › {code}
    </nav>
  )

  if (history.isError) {
    const notFound = history.error instanceof DeviceNotFoundError
    return (
      <div className="flex flex-col gap-5">
        {breadcrumb}
        <div className="rounded-lg border border-border-subtle bg-surface">
          {notFound ? (
            <EmptyState
              icon={SearchX}
              title="Equipo no encontrado"
              description={`No existe un equipo con el código ${code}.`}
              action={<Button onClick={() => navigate('/')}>Volver al dashboard</Button>}
            />
          ) : (
            <ErrorState title="No se pudo cargar el historial del equipo" onRetry={() => history.refetch()} />
          )}
        </div>
      </div>
    )
  }

  if (history.isPending) {
    return (
      <div className="flex flex-col gap-5">
        {breadcrumb}
        <DeviceHistorySkeleton />
      </div>
    )
  }

  const device = history.data
  const isRetired = device.status === 'RETIRED'

  return (
    <div className="flex flex-col gap-5">
      {breadcrumb}

      {device.retirement && (
        <Notice>
          Equipo retirado el {formatDate(device.retirement.retired_at)}
          {device.retirement.incident_number &&
            ` por la incidencia ${device.retirement.incident_number} (${device.retirement.action_name})`}
          . No se incluye en el cálculo de riesgo.
        </Notice>
      )}

      <DeviceHeader device={device} onRegisterIncident={registerIncident} />

      {isRetired || !device.current_risk ? (
        <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-6">
          <h2 className="text-base font-semibold">Riesgo actual</h2>
          <p className="text-text-muted">No aplica · equipo retirado</p>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          <CurrentRiskCard risk={device.current_risk} />
          <RiskEvolutionChart history={device.risk_history} />
        </div>
      )}

      {incidents.isPending ? (
        <TableSkeleton rows={10} columns={9} withTitle />
      ) : incidents.isError ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState title="No se pudieron cargar las incidencias" onRetry={() => incidents.refetch()} />
        </div>
      ) : (
        <DeviceIncidentsTable
          incidents={incidents.data.items}
          now={incidents.data.now}
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title="Este equipo no tiene incidencias registradas"
              action={
                !isRetired &&
                registerIncident && (
                  <Button variant="primary" onClick={registerIncident}>
                    Registrar la primera incidencia
                  </Button>
                )
              }
            />
          }
          footer={
            incidents.data.total > 0 && (
              <Pagination
                page={page}
                pageSize={HISTORY_PAGE_SIZE}
                totalItems={incidents.data.total}
                onPageChange={setPage}
              />
            )
          }
        />
      )}
    </div>
  )
}

export default DeviceHistoryPage
