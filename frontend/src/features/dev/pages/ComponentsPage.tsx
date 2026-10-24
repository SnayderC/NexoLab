import { Plus, RefreshCw } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import ErrorState from '../../../components/ui/ErrorState'
import PriorityBadge from '../../../components/ui/PriorityBadge'
import RiskBadge from '../../../components/ui/RiskBadge'
import Skeleton from '../../../components/ui/Skeleton'
import FormShowcase from '../components/FormShowcase'
import OverlayShowcase from '../components/OverlayShowcase'
import ShowcaseSection from '../components/ShowcaseSection'
import TableShowcase from '../components/TableShowcase'

// Página temporal (solo en `npm run dev`) para revisar los componentes contra el Figma.
// Se elimina, junto con features/dev/, cuando las pantallas reales los usen.
function ComponentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Componentes</h1>

      <ShowcaseSection title="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={Plus}>
            Registrar incidencia
          </Button>
          <Button>Cancelar</Button>
          <Button variant="danger">Retirar equipo</Button>
          <Button variant="primary" disabled>
            Deshabilitado
          </Button>
          <Button size="sm">Cerrar</Button>
          <Button size="sm" icon={RefreshCw}>
            Recalcular ahora
          </Button>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge level="HIGH" />
          <RiskBadge level="MEDIUM" />
          <RiskBadge level="LOW" />
          <RiskBadge level="HIGH" format="long" />
          <PriorityBadge priority="HIGH" />
          <PriorityBadge priority="MEDIUM" />
          <PriorityBadge priority="LOW" />
          <Badge tone="info">Abierta</Badge>
          <Badge tone="success">Cerrada</Badge>
          <Badge tone="success">Activo</Badge>
          <Badge tone="neutral">Retirado</Badge>
        </div>
      </ShowcaseSection>

      <FormShowcase />
      <TableShowcase />
      <OverlayShowcase />

      <ShowcaseSection title="Esqueleto de carga (tarjeta de equipo)">
        <div className="relative flex w-85 flex-col gap-2 overflow-hidden rounded-lg border border-border-subtle bg-surface p-3">
          <span className="absolute inset-y-0 left-0 w-1 bg-skeleton" aria-hidden />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-5.5 w-13" />
          </div>
          <Skeleton className="h-3 w-45" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Estado de error">
        <ErrorState onRetry={() => {}} />
      </ShowcaseSection>
    </div>
  )
}

export default ComponentsPage
