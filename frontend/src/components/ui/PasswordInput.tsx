import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'
import { controlClasses } from './controlStyles'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean
}

// Campo de contraseña con botón para mostrarla u ocultarla.
function PasswordInput({ invalid, className = '', ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={isVisible ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        className={`h-10 pr-10 ${controlClasses} ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={isVisible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-text-muted hover:text-text"
      >
        {isVisible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  )
}

export default PasswordInput
