import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthError } from '../api'
import LoginForm from './LoginForm'

async function fillAndSubmit(password = 'clave-incorrecta') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Correo electrónico'), 'andrea@test.ec')
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
}

describe('Formulario de inicio de sesión', () => {
  it('el botón se habilita solo con correo y contraseña escritos', async () => {
    render(<LoginForm onLogin={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Iniciar sesión' })
    expect(button).toBeDisabled()
    await userEvent.setup().type(screen.getByLabelText('Correo electrónico'), 'andrea@test.ec')
    expect(button).toBeDisabled()
    await userEvent.setup().type(screen.getByLabelText('Contraseña'), 'x')
    expect(button).toBeEnabled()
  })

  it('RN-01: muestra un mensaje genérico ante credenciales incorrectas', async () => {
    render(<LoginForm onLogin={vi.fn().mockRejectedValue(new AuthError('INVALID_CREDENTIALS'))} />)
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
  })

  it('RN-25: muestra el tiempo de bloqueo que envía el backend', async () => {
    const message = 'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.'
    render(<LoginForm onLogin={vi.fn().mockRejectedValue(new AuthError('TOO_MANY_ATTEMPTS', message))} />)
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
  })

  it('D-47: avisa que la sesión expiró', () => {
    render(<LoginForm onLogin={vi.fn()} sessionExpired />)
    expect(screen.getByRole('status')).toHaveTextContent('Tu sesión expiró')
  })

  it('envía el correo y la contraseña escritos', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined)
    render(<LoginForm onLogin={onLogin} />)
    await fillAndSubmit('Laboratorio-2026')
    expect(onLogin).toHaveBeenCalledWith('andrea@test.ec', 'Laboratorio-2026')
  })
})
