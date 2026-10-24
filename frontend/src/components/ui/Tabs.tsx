type Tab<T extends string> = {
  value: T
  label: string
}

type TabsProps<T extends string> = {
  tabs: Tab<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
}

// Pestañas con subrayado, como "Abiertas (7) · Cerradas · Todas" en Incidencias.
function Tabs<T extends string>({ tabs, value, onChange, 'aria-label': ariaLabel }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-6 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.value === value

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`-mb-px flex h-11 items-center border-b-2 px-3 ${
              isActive
                ? 'border-primary font-semibold text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
