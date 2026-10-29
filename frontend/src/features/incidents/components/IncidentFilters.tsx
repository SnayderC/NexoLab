import Input from '../../../components/ui/Input'
import SearchInput from '../../../components/ui/SearchInput'
import Select, { type SelectOption } from '../../../components/ui/Select'
import type { Priority } from '../../../types/incident'
import { useDeviceOptions } from '../../devices/useDeviceOptions'
import type { IncidentListFilters } from '../api'

type FilterValues = Pick<IncidentListFilters, 'search' | 'laboratory_id' | 'priority' | 'from' | 'to'>

type IncidentFiltersProps = {
  filters: FilterValues
  onChange: (changes: Partial<FilterValues>) => void
}

const ALL = 'all'

const priorityOptions: SelectOption[] = [
  { value: ALL, label: 'Todas' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
]

// Barra de filtros del Figma 3.0: búsqueda, laboratorio, prioridad y rango de fechas de la falla.
function IncidentFilters({ filters, onChange }: IncidentFiltersProps) {
  const { options } = useDeviceOptions()
  const laboratoryOptions: SelectOption[] = [
    { value: ALL, label: 'Todos' },
    ...options.laboratories.map((lab) => ({ value: String(lab.id), label: lab.code })),
  ]

  return (
    <div className="flex gap-3">
      <SearchInput
        className="flex-1"
        placeholder="Buscar por n.º o código de equipo"
        aria-label="Buscar por n.º o código de equipo"
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value })}
      />
      <div className="w-47">
        <Select
          options={laboratoryOptions}
          value={filters.laboratory_id === null ? ALL : String(filters.laboratory_id)}
          onChange={(value) => onChange({ laboratory_id: value === ALL ? null : Number(value) })}
          valuePrefix="Laboratorio:"
          aria-label="Filtrar por laboratorio"
        />
      </div>
      <div className="w-42">
        <Select
          options={priorityOptions}
          value={filters.priority ?? ALL}
          onChange={(value) => onChange({ priority: value === ALL ? null : (value as Priority) })}
          valuePrefix="Prioridad:"
          aria-label="Filtrar por prioridad"
        />
      </div>
      <div className="w-36">
        <Input
          type="date"
          aria-label="Desde"
          title="Desde"
          value={filters.from ?? ''}
          max={filters.to ?? undefined}
          onChange={(event) => onChange({ from: event.target.value || null })}
        />
      </div>
      <div className="w-36">
        <Input
          type="date"
          aria-label="Hasta"
          title="Hasta"
          value={filters.to ?? ''}
          min={filters.from ?? undefined}
          onChange={(event) => onChange({ to: event.target.value || null })}
        />
      </div>
    </div>
  )
}

export default IncidentFilters
