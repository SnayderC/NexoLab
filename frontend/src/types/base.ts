// Campos de control que tienen todas las tablas (docs/NEXOLAB_BD_v4.dbml).
// Las fechas llegan como texto ISO 8601 (timestamptz).
export type BaseRecord = {
  id: number
  is_active: boolean
  created_at: string
  updated_at: string
}
