import type { User } from '../types/user'
import { record } from './record'

// Datos de demostración: parte 3 de docs/PROMPT_FIGMA_MAKE_NEXOLAB.md.
// role_id: 1 = Técnico de soporte, 2 = Administrador (ver mocks/catalogs.ts).

export const users: User[] = [
  {
    ...record(1),
    role_id: 2,
    first_name: 'Andrea',
    last_name: 'Villacís',
    email: 'andrea.villacis@gmail.com',
    last_login_at: '2026-10-17T08:12:00-05:00',
  },
  {
    ...record(2),
    role_id: 1,
    first_name: 'Carlos',
    last_name: 'Mendoza',
    email: 'carlos.mendoza@gmail.com',
    last_login_at: '2026-10-17T07:58:00-05:00',
  },
  {
    // Usuario desactivado: sirve para probar "Tu cuenta está desactivada".
    ...record(3, { is_active: false }),
    role_id: 1,
    first_name: 'Luis',
    last_name: 'Bravo',
    email: 'luis.bravo@gmail.com',
    last_login_at: '2026-08-02T16:40:00-05:00',
  },
]
