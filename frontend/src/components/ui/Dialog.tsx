import { useEffect, useRef, type ReactNode } from 'react'

type DialogProps = {
  open: boolean
  onClose: () => void
  className?: string
  'aria-labelledby'?: string
  children: ReactNode
}

// Base de Modal y ConfirmDialog. Usa el <dialog> del navegador, que ya mantiene
// el foco dentro, cierra con Escape y oscurece el fondo (::backdrop).
function Dialog({ open, onClose, className = '', children, ...aria }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // Un clic en el fondo oscurecido llega con el propio <dialog> como destino.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`m-auto flex-col overflow-hidden rounded-xl bg-surface p-0 text-text shadow-modal backdrop:bg-overlay open:flex ${className}`}
      {...aria}
    >
      {children}
    </dialog>
  )
}

export default Dialog
