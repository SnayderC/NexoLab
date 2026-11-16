import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AuditChanges from './AuditChanges'

describe('Cambios de la bitácora (D-52)', () => {
  it('muestra el valor anterior y el nuevo', () => {
    render(<AuditChanges changes={[{ field: 'station_count', label: 'Puestos', before: 30, after: 40 }]} />)
    expect(screen.getByRole('listitem')).toHaveTextContent('Puestos: 30 → 40')
  })

  it('al crear muestra solo el valor nuevo, y los sí/no en español', () => {
    render(
      <AuditChanges
        changes={[
          { field: 'code', label: 'Código', before: null, after: 'H110' },
          { field: 'is_active', label: 'Activo', before: true, after: false },
        ]}
      />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Código: H110')
    expect(items[1]).toHaveTextContent('Activo: Sí → No')
  })

  it('sin cambios muestra un guion', () => {
    render(<AuditChanges changes={[]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
