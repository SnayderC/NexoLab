import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, setSessionExpiredHandler } from './apiClient'

function respond(status: number, body: unknown = {}) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('apiClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    document.cookie = 'csrftoken=token-de-prueba'
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    setSessionExpiredHandler(null)
  })

  it('envía la cookie de sesión y, al modificar datos, el token CSRF en la cabecera', async () => {
    fetchMock.mockResolvedValue(respond(200, { ok: true }))
    await apiRequest('/incidents', { method: 'POST', body: { description: 'No enciende' } })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/incidents')
    expect(options.credentials).toBe('same-origin')
    expect(options.headers['X-CSRFToken']).toBe('token-de-prueba')
    expect(JSON.parse(options.body)).toEqual({ description: 'No enciende' })
  })

  it('convierte un error del backend en ApiError con su mensaje', async () => {
    fetchMock.mockResolvedValue(respond(409, { detail: 'La incidencia ya está cerrada', code: 'incident_closed' }))
    const error = (await apiRequest('/incidents/INC-2026-0001/close', { method: 'POST' }).catch((e) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.message).toBe('La incidencia ya está cerrada')
  })

  it('D-47: un 401 avisa que la sesión venció', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    fetchMock.mockResolvedValue(respond(401, { detail: 'No autenticado' }))

    await expect(apiRequest('/dashboard/summary')).rejects.toBeInstanceOf(ApiError)
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('D-47: el 401 de las rutas de la propia sesión no cuenta como "venció"', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    fetchMock.mockResolvedValue(respond(401))

    await expect(apiRequest('/auth/me')).rejects.toBeInstanceOf(ApiError)
    expect(onExpired).not.toHaveBeenCalled()
  })

  it('un 403 (sin permiso) no cierra la sesión', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    fetchMock.mockResolvedValue(respond(403, { detail: 'Esta sección es solo para administradores.' }))

    await expect(apiRequest('/users')).rejects.toBeInstanceOf(ApiError)
    expect(onExpired).not.toHaveBeenCalled()
  })
})
