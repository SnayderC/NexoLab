import type { SelectOption } from './Select'

type OptionGroupProps = {
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  // Id de la etiqueta que nombra al grupo (FormField la crea como `${id}-label`).
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

// Botones de opción única, como "Componente afectado" y "Prioridad" en el Figma.
function OptionGroup({ options, value, onChange, ...aria }: OptionGroupProps) {
  return (
    <div role="radiogroup" className="flex gap-2" {...aria}>
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg border px-3 ${
              isSelected
                ? 'border-primary bg-info-bg text-primary'
                : 'border-border bg-surface text-text hover:bg-background'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default OptionGroup
