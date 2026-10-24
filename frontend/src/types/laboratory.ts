import type { BaseRecord } from './base'

// mst_laboratories
export type Laboratory = BaseRecord & {
  code: string
  name: string
  location: string | null
  station_count: number
  responsible_technician_id: number | null
}
