import Input from '../../../components/ui/Input'
import Select, { type SelectOption } from '../../../components/ui/Select'
import { useDeviceOptions } from '../../devices/useDeviceOptions'
import type { ReportFilters as Filters } from '../api'

type ReportFiltersProps = {
  filters: Filters
  onChange: (changes: Partial<Filters>) => void
}

const ALL = 'all'

// Periodo (desde y hasta) y laboratorio. Las fechas son obligatorias: sin ellas no hay periodo.
function ReportFilters({ filters, onChange }: ReportFiltersProps) {
  const { options } = useDeviceOptions()
  const laboratoryOptions: SelectOption[] = [
    { value: ALL, label: 'Todos' },
    ...options.laboratories.map((lab) => ({ value: String(lab.id), label: lab.code })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-52">
        <Select
          options={laboratoryOptions}
          value={filters.laboratory_id === null ? ALL : String(filters.laboratory_id)}
          onChange={(value) => onChange({ laboratory_id: value === ALL ? null : Number(value) })}
          valuePrefix="Laboratorio:"
          aria-label="Filtrar por laboratorio"
        />
      </div>
      <span className="text-text-muted">Desde</span>
      <div className="w-40">
        <Input
          type="date"
          aria-label="Desde"
          value={filters.from}
          max={filters.to}
          onChange={(event) => event.target.value && onChange({ from: event.target.value })}
        />
      </div>
      <span className="text-text-muted">hasta</span>
      <div className="w-40">
        <Input
          type="date"
          aria-label="Hasta"
          value={filters.to}
          min={filters.from}
          onChange={(event) => event.target.value && onChange({ to: event.target.value })}
        />
      </div>
    </div>
  )
}

export default ReportFilters
