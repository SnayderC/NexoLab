import type { InputHTMLAttributes } from 'react'
import { controlClasses } from './controlStyles'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

function Input({ invalid, className = '', ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`h-10 ${controlClasses} ${className}`}
      {...props}
    />
  )
}

export default Input
