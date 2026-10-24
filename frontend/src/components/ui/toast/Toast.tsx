import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import type { ToastTone } from './toastContext'

type ToastProps = {
  message: string
  tone: ToastTone
  onClose: () => void
}

const toneConfig = {
  success: { icon: CircleCheck, borderClass: 'border-success', iconClass: 'text-success' },
  error: { icon: CircleAlert, borderClass: 'border-danger', iconClass: 'text-danger' },
  info: { icon: Info, borderClass: 'border-primary', iconClass: 'text-primary' },
}

function Toast({ message, tone, onClose }: ToastProps) {
  const { icon: Icon, borderClass, iconClass } = toneConfig[tone]

  return (
    <div
      className={`flex w-130 max-w-full items-center gap-3 rounded-lg border-l-4 bg-surface p-4 shadow-toast ${borderClass}`}
    >
      <Icon className={`size-5 shrink-0 ${iconClass}`} aria-hidden />
      <p className="flex-1 leading-5">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar mensaje"
        className="rounded-md text-text-muted hover:text-text"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}

export default Toast
