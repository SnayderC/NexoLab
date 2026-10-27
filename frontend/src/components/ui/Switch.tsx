type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
  disabled?: boolean
}

// Interruptor del Figma 5.1 ("Activo"): índigo encendido, gris apagado.
function Switch({ checked, onChange, label, id, disabled }: SwitchProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 has-disabled:cursor-not-allowed has-disabled:opacity-50">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none ${
          checked ? 'bg-nav-active' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.75 left-0.75 size-4.5 rounded-full bg-surface shadow-menu transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
          aria-hidden
        />
      </button>
      <span>{label}</span>
    </label>
  )
}

export default Switch
