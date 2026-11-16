import { X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import Dialog from './Dialog'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  // md = 560 px (formularios cortos), lg = 800 px (como "Nuevo equipo").
  size?: 'md' | 'lg'
  footer?: ReactNode
  children: ReactNode
}

const sizeClasses = {
  // D-51: en pantallas angostas, el ancho de la pantalla menos 2 rem.
  md: 'w-140 max-w-[calc(100vw-2rem)]',
  lg: 'w-200 max-w-[calc(100vw-2rem)]',
}

function Modal({ open, onClose, title, size = 'lg', footer, children }: ModalProps) {
  const titleId = useId()

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} className={sizeClasses[size]}>
      <header className="flex h-18 shrink-0 items-center justify-between border-b border-border-subtle px-6">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-md text-text-muted hover:text-text"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div className="flex flex-col gap-5 overflow-y-auto p-6">{children}</div>

      {footer && (
        <footer className="flex shrink-0 justify-end gap-3 border-t border-border-subtle px-6 py-5">
          {footer}
        </footer>
      )}
    </Dialog>
  )
}

export default Modal
