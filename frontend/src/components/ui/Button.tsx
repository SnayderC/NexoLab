import { LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'info'
type ButtonSize = 'md' | 'sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  // Muestra un indicador girando y deshabilita el botón mientras se envía algo.
  isLoading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-linear-to-r from-primary to-accent text-surface hover:opacity-90',
  secondary: 'border-border bg-surface text-text hover:bg-background',
  danger: 'border-transparent bg-danger-strong text-surface hover:opacity-90',
  // Sobre avisos azules, como "Recalcular ahora" en el dashboard.
  info: 'border-info-border bg-surface text-info-text hover:bg-info-bg',
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-10 gap-2 px-4 text-sm',
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
}

const iconSizes: Record<ButtonSize, string> = {
  md: 'size-4.5',
  sm: 'size-4',
}

function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  isLoading = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  // Figma 3.8 y 4.2: el botón principal deshabilitado es gris, no el degradado atenuado.
  const appearance =
    disabled && !isLoading && variant === 'primary'
      ? 'border-transparent bg-border-subtle text-text-disabled'
      : `${variantClasses[variant]} ${isLoading ? '' : 'disabled:opacity-50'}`

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border font-medium whitespace-nowrap transition disabled:pointer-events-none ${appearance} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle className={`animate-spin ${iconSizes[size]}`} aria-hidden />
      ) : (
        Icon && <Icon className={iconSizes[size]} aria-hidden />
      )}
      {children}
    </button>
  )
}

export default Button
