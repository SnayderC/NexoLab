// hst_audit_logs (D-52): bitácora de cambios administrativos. Los nombres en español los arma el backend.

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'RESET_PASSWORD'
  | 'RETIRE'
  | 'CATALOG_SELECTION'
  | 'VOID'
  | 'TECHNICIAN_MODE_ON'
  | 'TECHNICIAN_MODE_OFF'

export type AuditEntityType = 'USER' | 'LABORATORY' | 'DEVICE' | 'DEVICE_TYPE' | 'INCIDENT'

// Un campo que cambió: valor anterior y nuevo (texto, número, sí/no o vacío).
export type AuditChange = {
  field: string
  label: string
  before: string | number | boolean | null
  after: string | number | boolean | null
}

export type AuditLog = {
  id: number
  created_at: string
  user_id: number
  user_name: string
  action: AuditAction
  action_name: string
  entity_type: AuditEntityType
  entity_type_name: string
  entity_id: number | null
  entity_label: string
  changes: AuditChange[]
}
