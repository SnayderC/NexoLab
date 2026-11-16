import { apiRequest } from '../../lib/apiClient'
import type { AuditEntityType, AuditLog } from '../../types/audit'

// Usa la API real: GET audit-logs (administrador, D-52).

export const AUDIT_PAGE_SIZE = 20

export type AuditLogFilters = {
  entity_type: AuditEntityType | null
  user_id: number | null
  // Fechas aaaa-mm-dd en hora de Ecuador.
  from: string | null
  to: string | null
  page: number
}

export type AuditLogPage = {
  items: AuditLog[]
  total: number
  entity_types: { value: AuditEntityType; label: string }[]
}

export function listAuditLogs(filters: AuditLogFilters): Promise<AuditLogPage> {
  const params = new URLSearchParams({ page: String(filters.page) })
  if (filters.entity_type) params.set('entity_type', filters.entity_type)
  if (filters.user_id !== null) params.set('user_id', String(filters.user_id))
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  return apiRequest<AuditLogPage>(`/audit-logs?${params}`)
}
