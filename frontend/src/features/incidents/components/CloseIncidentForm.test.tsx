import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { IncidentDetail } from '../api'
import CloseIncidentForm, { CLOSE_INCIDENT_FORM_ID } from './CloseIncidentForm'

const CONTROL = { is_active: true, created_at: '2026-11-01T10:00:00-05:00', updated_at: '2026-11-01T10:00:00-05:00' }

// Los resultados de la atención vienen del catálogo; aquí se simulan para no depender del backend.
vi.mock('../../catalog/useCatalog', () => ({
  useCatalogs: () => ({
    data: {
      resolution_actions: [
        { ...CONTROL, id: 1, code: 'RESOLVED', name: 'Resuelto', is_retirement_action: false },
        { ...CONTROL, id: 2, code: 'REPLACEMENT_REQUIRED', name: 'Requiere reemplazo', is_retirement_action: true },
        { ...CONTROL, id: 3, code: 'REFERRED', name: 'Derivado', is_retirement_action: false },
      ],
    },
  }),
}))

const incident: IncidentDetail = {
  id: 7,
  incident_number: 'INC-2026-0007',
  device_id: 5,
  device_code: 'H101-PC-05',
  laboratory_code: 'H101',
  component_name: 'Monitor',
  priority: 'HIGH',
  status: 'OPEN',
  opened_at: '2026-11-01T08:00:00-05:00',
  description: 'El monitor no enciende.',
  resolution_time_minutes: null,
  reported_by_name: 'Carlos Mendoza',
  closed_by_name: null,
  resolution_action_name: null,
  diagnosis: null,
  notes: null,
  closed_at: null,
}

function renderForm(onSubmit = vi.fn()) {
  render(
    <>
      <CloseIncidentForm incident={incident} closedByName="Carlos Mendoza" onSubmit={onSubmit} />
      <button type="submit" form={CLOSE_INCIDENT_FORM_ID}>
        Cerrar incidencia
      </button>
    </>,
  )
  return onSubmit
}

describe('Cerrar incidencia', () => {
  it('D-44: pide la solución aplicada y el resultado de la atención', async () => {
    const onSubmit = renderForm()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar incidencia' }))

    expect(await screen.findByText('La solución aplicada es obligatoria')).toBeInTheDocument()
    expect(screen.getByText('Selecciona el resultado de la atención')).toBeInTheDocument()
    expect(screen.queryByText(/diagn[oó]stico/i)).not.toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('RN-19: avisa que "Requiere reemplazo" retira el equipo', async () => {
    renderForm()
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Requiere reemplazo' }))
    expect(screen.getByRole('status')).toHaveTextContent('El equipo H101-PC-05 pasará a estado Retirado')
  })

  it('envía la solución, el resultado y las observaciones', async () => {
    const onSubmit = renderForm()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Solución aplicada'), 'Se reemplazó el cable de video.')
    await user.click(screen.getByRole('radio', { name: 'Resuelto' }))
    await user.click(screen.getByRole('button', { name: 'Cerrar incidencia' }))

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      resolution_action_id: 1,
      diagnosis: 'Se reemplazó el cable de video.',
      notes: null,
    })
  })
})
