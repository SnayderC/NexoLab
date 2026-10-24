import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { controlClasses } from './controlStyles'

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

// Campo de búsqueda con lupa a la izquierda.
function SearchInput({ className = '', ...props }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
      <input type="search" className={`h-10 pl-9.5 ${controlClasses}`} {...props} />
    </div>
  )
}

export default SearchInput
