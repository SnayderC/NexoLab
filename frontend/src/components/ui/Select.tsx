import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { controlClasses } from './controlStyles'

export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  id?: string
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  // Texto gris antes del valor, como en los filtros: "Laboratorio: Todos".
  valuePrefix?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

// Lista desplegable propia (el <select> del navegador no permite el estilo del Figma).
// Teclado: flechas para moverse, Enter o espacio para elegir, Escape para cerrar.
function Select({
  id,
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled,
  invalid,
  valuePrefix,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
}: SelectProps) {
  const generatedId = useId()
  const buttonId = id ?? generatedId
  const listId = `${buttonId}-list`
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) return

    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  function open() {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
    setIsOpen(true)
  }

  function choose(index: number) {
    onChange(options[index].value)
    setIsOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        open()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, options.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (activeIndex >= 0) choose(activeIndex)
        break
      case 'Escape':
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={handleKeyDown}
        className={`flex h-10 items-center gap-2 text-left ${controlClasses} ${isOpen ? 'border-primary' : ''}`}
      >
        <span className={`flex-1 truncate ${selected || disabled ? '' : 'text-text-muted'}`}>
          {valuePrefix && <span className="text-text-muted">{valuePrefix} </span>}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="size-4.5 shrink-0 text-text-muted" aria-hidden />
      </button>

      {isOpen && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-menu"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value

            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
                className={`flex h-8.5 cursor-pointer items-center justify-between rounded-md px-3 ${
                  isSelected
                    ? 'bg-nav-active-bg text-nav-active'
                    : index === activeIndex
                      ? 'bg-background'
                      : ''
                }`}
              >
                {option.label}
                {isSelected && <Check className="size-4" aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Select
