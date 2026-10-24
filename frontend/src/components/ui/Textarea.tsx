import type { TextareaHTMLAttributes } from 'react'
import { controlClasses } from './controlStyles'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
  // Alto mínimo: sm = 64 px (observaciones), md = 96 px (diagnóstico), lg = 112 px (descripción).
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'min-h-16',
  md: 'min-h-24',
  lg: 'min-h-28',
}

function Textarea({ invalid, size = 'lg', className = '', ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`resize-y py-3 ${sizeClasses[size]} ${controlClasses} ${className}`}
      {...props}
    />
  )
}

export default Textarea
