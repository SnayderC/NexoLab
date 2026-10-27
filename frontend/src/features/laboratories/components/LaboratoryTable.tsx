import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Table, { type TableColumn } from '../../../components/ui/Table'
import type { LaboratoryListItem } from '../api'

type LaboratoryTableProps = {
  laboratories: LaboratoryListItem[]
  onEdit: (laboratory: LaboratoryListItem) => void
  onToggleActive: (laboratory: LaboratoryListItem) => void
}

// Tabla del Figma "5.0 Laboratorios / Lista". Anchos del Figma más el relleno de la celda.
function LaboratoryTable({ laboratories, onEdit, onToggleActive }: LaboratoryTableProps) {
  const totalActiveDevices = laboratories.reduce((sum, lab) => sum + lab.active_device_count, 0)

  const columns: TableColumn<LaboratoryListItem>[] = [
    { key: 'code', header: 'Código', className: 'w-19', render: (lab) => lab.code },
    { key: 'name', header: 'Nombre', className: 'w-35', render: (lab) => lab.name },
    { key: 'location', header: 'Ubicación', className: 'w-38', render: (lab) => lab.location ?? '—' },
    { key: 'stations', header: 'Puestos', className: 'w-17', render: (lab) => lab.station_count },
    { key: 'responsible', header: 'Responsable', className: 'w-31', render: (lab) => lab.responsible_name ?? '—' },
    {
      key: 'devices',
      header: 'Equipos activos',
      className: 'w-46',
      render: (lab) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{lab.active_device_count}</span>
          {lab.device_breakdown && <span className="text-text-muted">{lab.device_breakdown}</span>}
        </div>
      ),
    },
    { key: 'open', header: 'Incidencias abiertas', className: 'w-24', render: (lab) => lab.open_incident_count },
    {
      key: 'status',
      header: 'Estado',
      className: 'w-19',
      render: (lab) =>
        lab.is_active ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-30',
      render: (lab) => (
        <div className="flex flex-col items-start gap-2">
          <Button size="sm" onClick={() => onEdit(lab)}>
            Editar
          </Button>
          <Button size="sm" onClick={() => onToggleActive(lab)}>
            {lab.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Table
      caption="Laboratorios"
      columns={columns}
      rows={laboratories}
      getRowKey={(lab) => lab.id}
      footer={
        <p className="px-5 py-5 text-text-muted">
          {laboratories.length} laboratorios · {totalActiveDevices} equipos activos
        </p>
      }
    />
  )
}

export default LaboratoryTable
