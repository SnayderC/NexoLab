import type { BaseRecord } from '../types/base'

// Fecha en que se "crearon" los datos de demostración.
const SEED_DATE = '2026-08-01T08:00:00-05:00'

// Campos de control comunes para un registro de demostración.
export function record(id: number, overrides: Partial<BaseRecord> = {}): BaseRecord {
  return { id, is_active: true, created_at: SEED_DATE, updated_at: SEED_DATE, ...overrides }
}
