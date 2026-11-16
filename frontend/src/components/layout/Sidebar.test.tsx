import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sessionUser, withSession } from '../../test/fixtures'
import Sidebar from './Sidebar'

function links() {
  return screen.getAllByRole('link').map((link) => link.textContent)
}

// RN-24 (D-45): cada rol y cada modo ve solo su menú.
describe('Menú lateral', () => {
  it('el técnico registra incidencias y no ve Administración', () => {
    render(withSession(sessionUser('TECHNICIAN'), <Sidebar open={false} onClose={() => {}} />))
    expect(links()).toEqual(['Dashboard', 'Incidencias', 'Registrar incidencia', 'Reportes'])
  })

  it('el administrador en su modo ve Administración y la Bitácora, pero no Registrar incidencia', () => {
    render(withSession(sessionUser('ADMIN'), <Sidebar open={false} onClose={() => {}} />))
    expect(links()).toEqual([
      'Dashboard',
      'Incidencias',
      'Reportes',
      'Laboratorios',
      'Equipos',
      'Catálogo de equipos',
      'Usuarios',
      'Bitácora',
    ])
  })

  it('el administrador en modo técnico ve el menú del técnico', () => {
    render(withSession(sessionUser('ADMIN', true), <Sidebar open={false} onClose={() => {}} />))
    expect(links()).toEqual(['Dashboard', 'Incidencias', 'Registrar incidencia', 'Reportes'])
  })
})
