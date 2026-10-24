import { useContext } from 'react'
import { ToastContext } from './toastContext'

// Uso: const { showToast } = useToast(); showToast({ message: 'Incidencia registrada' })
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
