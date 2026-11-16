import SearchInput from '../../../components/ui/SearchInput'
import Select, { type SelectOption } from '../../../components/ui/Select'
import type { RiskLevelCode } from '../../../types/catalog'
import type { DeviceListFilters, DeviceStatusFilter } from '../api'
import { useDeviceOptions } from '../useDeviceOptions'

type FilterValues = Omit<DeviceListFilters, 'page'>

type DeviceFiltersProps = {
  filters: FilterValues
  onChange: (changes: Partial<FilterValues>) => void
}

const ALL = 'all'
const statusOptions: SelectOption[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'RETIRED', label: 'Retirado' },
  { value: 'ALL', label: 'Todos' },
]
const riskOptions: SelectOption[] = [
  { value: ALL, label: 'Todos' },
  { value: 'HIGH', label: 'Alto' },
  { value: 'MEDIUM', label: 'Medio' },
  { value: 'LOW', label: 'Bajo' },
]

const toValue = (id: number | null) => (id === null ? ALL : String(id))
const toId = (value: string) => (value === ALL ? null : Number(value))

// Barra de filtros del Figma 5.4.
function DeviceFilters({ filters, onChange }: DeviceFiltersProps) {
  const { options } = useDeviceOptions()
  const laboratoryOptions: SelectOption[] = [
    { value: ALL, label: 'Todos' },
    ...options.laboratories.map((lab) => ({ value: String(lab.id), label: lab.code })),
  ]
  const typeOptions: SelectOption[] = [
    { value: ALL, label: 'Todos' },
    ...options.deviceTypes.map((type) => ({ value: String(type.id), label: type.name })),
  ]

  return (
    <div className="flex flex-wrap gap-3">
      <SearchInput
        className="max-lg:basis-full lg:flex-1"
        placeholder="Buscar por código"
        aria-label="Buscar por código"
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value })}
      />
      <div className="w-47">
        <Select
          options={laboratoryOptions}
          value={toValue(filters.laboratory_id)}
          onChange={(value) => onChange({ laboratory_id: toId(value) })}
          valuePrefix="Laboratorio:"
          aria-label="Filtrar por laboratorio"
        />
      </div>
      <div className="w-47">
        <Select
          options={typeOptions}
          value={toValue(filters.device_type_id)}
          onChange={(value) => onChange({ device_type_id: toId(value) })}
          valuePrefix="Tipo:"
          aria-label="Filtrar por tipo"
        />
      </div>
      <div className="w-47">
        <Select
          options={statusOptions}
          value={filters.status}
          onChange={(value) => onChange({ status: value as DeviceStatusFilter })}
          valuePrefix="Estado:"
          aria-label="Filtrar por estado"
        />
      </div>
      <div className="w-47">
        <Select
          options={riskOptions}
          value={filters.risk_level ?? ALL}
          onChange={(value) => onChange({ risk_level: value === ALL ? null : (value as RiskLevelCode) })}
          valuePrefix="Riesgo:"
          aria-label="Filtrar por riesgo"
        />
      </div>
    </div>
  )
}

export default DeviceFilters
