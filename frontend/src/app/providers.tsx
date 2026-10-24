import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import ToastProvider from '../components/ui/toast/ToastProvider'
import AuthProvider from '../features/auth/AuthProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos se consideran vigentes 30 s antes de volver a pedirlos.
      staleTime: 30_000,
      retry: 1,
    },
  },
})

// Proveedores globales: consultas (TanStack Query), sesión y mensajes emergentes.
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default AppProviders
