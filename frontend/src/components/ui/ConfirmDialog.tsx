import { useId } from 'react'
import Button from './Button'
import Dialog from './Dialog'

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel: string
  // null quita el botón de cancelar, para avisos de un solo botón como "Entendido" (Figma 5.3).
  cancelLabel?: string | null
  // "danger" para acciones como retirar un equipo.
  variant?: 'primary' | 'danger'
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'primary',
}: ConfirmDialogProps) {
  const titleId = useId()

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} className="w-140">
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <p className="leading-5.5">{message}</p>
      </div>
      <footer className="flex justify-end gap-3 border-t border-border-subtle px-6 py-5">
        {cancelLabel !== null && <Button onClick={onClose}>{cancelLabel}</Button>}
        <Button variant={variant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </footer>
    </Dialog>
  )
}

export default ConfirmDialog
