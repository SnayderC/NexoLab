import Badge from '../../../components/ui/Badge'
import type { IncidentStatusCode } from '../../../types/catalog'

// Sección 11: Abierta (azul), Cerrada (verde).
function IncidentStatusBadge({ status }: { status: IncidentStatusCode }) {
  return status === 'OPEN' ? <Badge tone="info">Abierta</Badge> : <Badge tone="success">Cerrada</Badge>
}

export default IncidentStatusBadge
