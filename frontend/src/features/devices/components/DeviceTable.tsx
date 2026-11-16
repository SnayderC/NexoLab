import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import RiskBadge from '../../../components/ui/RiskBadge'
import Table, { type TableColumn } from '../../../components/ui/Table'
import type { DeviceListItem } from '../api'

type DeviceTableProps = {
  devices: DeviceListItem[]
  onEdit: (device: DeviceListItem) => void
  emptyState: ReactNode
  footer: ReactNode
}

// Tabla del Figma "5.4 Equipos / Lista". Anchos del Figma más el relleno de la celda.
function DeviceTable({ devices, onEdit, emptyState, footer }: DeviceTableProps) {
  const navigate = useNavigate()

  const columns: TableColumn<DeviceListItem>[] = [
    {
      key: 'code',
      header: 'Código',
      className: 'w-38 whitespace-nowrap',
      render: (device) => (
        <Link to={`/equipos/${device.code}`} className="text-primary hover:underline">
          {device.code}
        </Link>
      ),
    },
    { key: 'type', header: 'Tipo', className: 'w-38.5', render: (device) => device.type_name },
    { key: 'laboratory', header: 'Laboratorio', className: 'w-28.5', render: (device) => device.laboratory_code },
    {
      key: 'location',
      header: 'Ubicación física',
      className: 'w-43.5',
      render: (device) => device.physical_location ?? '—',
    },
    {
      key: 'status',
      header: 'Estado',
      className: 'w-25',
      render: (device) =>
        device.status === 'ACTIVE' ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Retirado</Badge>,
    },
    {
      key: 'risk',
      header: 'Riesgo actual',
      className: 'w-36',
      render: (device) =>
        device.risk_level ? (
          <RiskBadge level={device.risk_level} format="long" />
        ) : (
          <span className="text-text-muted">No aplica</span>
        ),
    },
    { key: 'incidents', header: 'Incidencias', className: 'w-26', render: (device) => device.incident_count },
    {
      key: 'actions',
      header: 'Acciones',
      render: (device) => (
        <div className="flex gap-1.5">
          <Button size="sm" onClick={() => navigate(`/equipos/${device.code}`)}>
            Ver historial
          </Button>
          <Button size="sm" onClick={() => onEdit(device)}>
            Editar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Table
      caption="Equipos"
      tabletMinWidthClass="max-desktop:min-w-240"
      columns={columns}
      rows={devices}
      getRowKey={(device) => device.id}
      emptyState={emptyState}
      footer={footer}
    />
  )
}

export default DeviceTable
