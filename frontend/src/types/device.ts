import type { BaseRecord } from './base'

// mst_devices
export type Device = BaseRecord & {
  code: string
  laboratory_id: number
  device_type_id: number
  device_status_id: number
  physical_location: string | null
  specifications: string | null
  retired_at: string | null
}
