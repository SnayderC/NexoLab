import { SearchX } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import Pagination from '../../../components/ui/Pagination'
import RiskBadge from '../../../components/ui/RiskBadge'
import Table, { type TableColumn } from '../../../components/ui/Table'
import { showcaseDevices, type ShowcaseDevice } from '../showcaseData'
import ShowcaseSection from './ShowcaseSection'

const columns: TableColumn<ShowcaseDevice>[] = [
  {
    key: 'code',
    header: 'Código',
    render: (device) => (
      <Link to={`/equipos/${device.code}`} className="text-primary hover:underline">
        {device.code}
      </Link>
    ),
  },
  { key: 'type', header: 'Tipo', render: (device) => device.type_name },
  { key: 'laboratory', header: 'Laboratorio', render: (device) => device.laboratory_code },
  { key: 'location', header: 'Ubicación física', render: (device) => device.physical_location },
  { key: 'status', header: 'Estado', render: () => <Badge tone="success">Activo</Badge> },
  {
    key: 'risk',
    header: 'Riesgo actual',
    render: (device) => <RiskBadge level={device.risk_level} format="long" />,
  },
  { key: 'incidents', header: 'Incidencias', render: (device) => device.incident_count },
  {
    key: 'actions',
    header: 'Acciones',
    render: () => (
      <div className="flex gap-1.5">
        <Button size="sm">Ver historial</Button>
        <Button size="sm">Editar</Button>
      </div>
    ),
  },
]

// Réplica de "5.4 Equipos / Lista" y del estado sin resultados de "3.2".
function TableShowcase() {
  const [page, setPage] = useState(1)
  const [isEmpty, setIsEmpty] = useState(false)

  return (
    <ShowcaseSection title="Tabla y paginación">
      <div>
        <Button size="sm" onClick={() => setIsEmpty((empty) => !empty)}>
          {isEmpty ? 'Mostrar filas' : 'Mostrar estado vacío'}
        </Button>
      </div>
      <Table
        caption="Equipos de ejemplo"
        columns={columns}
        rows={isEmpty ? [] : showcaseDevices}
        getRowKey={(device) => device.code}
        emptyState={
          <EmptyState
            icon={SearchX}
            title="No hay incidencias con estos filtros"
            action={<Button onClick={() => setIsEmpty(false)}>Limpiar filtros</Button>}
          />
        }
        footer={
          isEmpty ? undefined : (
            <Pagination page={page} pageSize={10} totalItems={142} onPageChange={setPage} />
          )
        }
      />
    </ShowcaseSection>
  )
}

export default TableShowcase
