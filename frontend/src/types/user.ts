import type { BaseRecord } from './base'

// mst_users. No incluye password_hash: el backend nunca lo envía al frontend.
export type User = BaseRecord & {
  role_id: number
  first_name: string
  last_name: string
  email: string
  last_login_at: string | null
}
