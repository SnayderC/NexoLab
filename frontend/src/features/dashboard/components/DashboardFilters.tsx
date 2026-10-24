import Select, { type SelectOption } from '../../../components/ui/Select'
import { getDashboardFilterOptions, type DashboardFilters as Filters } from '../api'

type DashboardFiltersProps = {
  filters: Filters
  onChange: (filters: Filters) => void
}

const ALL = 'all'

const { laboratories, deviceTypes } = getDashboardFilterOptions()

const laboratoryOptions: SelectOption[] = [
  { value: ALL, label: 'Todos' },
  ...laboratories.map((lab) => ({ value: String(lab.id), label: lab.code })),
]

const deviceTypeOptions: SelectOption[] = [
  { value: ALL, label: 'Todos' },
  ...deviceTypes.map((type) => ({ value: String(type.id), label: type.name })),
]

const toValue = (id: number | null) => (id === null ? ALL : String(id))
const toId = (value: string) => (value === ALL ? null : Number(value))

function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  return (
    <div className="flex gap-4">
      <div className="w-52">
        <Select
          options={laboratoryOptions}
          value={toValue(filters.laboratory_id)}
          onChange={(value) => onChange({ ...filters, laboratory_id: toId(value) })}
          valuePrefix="Laboratorio:"
          aria-label="Filtrar por laboratorio"
        />
      </div>
      <div className="w-60">
        <Select
          options={deviceTypeOptions}
          value={toValue(filters.device_type_id)}
          onChange={(value) => onChange({ ...filters, device_type_id: toId(value) })}
          valuePrefix="Tipo de equipo:"
          aria-label="Filtrar por tipo de equipo"
        />
      </div>
    </div>
  )
}

export default DashboardFilters
