import type { ReactNode } from 'react'

type FormFieldProps = {
  // Debe coincidir con el id del control, para que la etiqueta lo active.
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  // Texto a la derecha de la línea de ayuda, por ejemplo "8/500".
  counter?: string
  children: ReactNode
}

// Etiqueta arriba, "*" en obligatorios y error en rojo debajo (sección 11).
// El control puede usar aria-describedby={`${id}-help`} para leer la ayuda o el error,
// y aria-labelledby={`${id}-label`} si no es un campo nativo (por ejemplo, OptionGroup).
function FormField({ id, label, required, error, hint, counter, children }: FormFieldProps) {
  const helpText = error ?? hint

  return (
    <div className="flex flex-col gap-1.5">
      <label id={`${id}-label`} htmlFor={id} className="font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {(helpText || counter) && (
        <div className="flex items-start gap-3 text-xs leading-4.5">
          <p id={`${id}-help`} className={`flex-1 ${error ? 'text-danger' : 'text-text-muted'}`}>
            {helpText}
          </p>
          {counter && <span className="text-text-muted">{counter}</span>}
        </div>
      )}
    </div>
  )
}

export default FormField
