// Cliente de la API de NexoLab (/api/v1, sección 13).
// Usa la sesión de Django: el navegador envía la cookie de sesión sola y, en las peticiones
// que modifican datos, se agrega el token CSRF que Django dejó en la cookie "csrftoken".

const API_BASE = '/api/v1'

export class ApiError extends Error {
  readonly status: number
  // Cuerpo de la respuesta de error, por ejemplo { detail, code } o { campo: ['mensaje'] }.
  readonly data: Record<string, unknown>

  constructor(status: number, data: Record<string, unknown>) {
    super(typeof data.detail === 'string' ? data.detail : `Error ${status}`)
    this.status = status
    this.data = data
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

// Pide la cookie CSRF si todavía no existe (por ejemplo, antes del login).
async function ensureCsrfCookie(): Promise<void> {
  if (!readCookie('csrftoken')) await fetch(`${API_BASE}/auth/csrf`, { credentials: 'same-origin' })
}

export async function apiRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (method !== 'GET') {
    await ensureCsrfCookie()
    headers['X-CSRFToken'] = readCookie('csrftoken') ?? ''
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, data)
  return data as T
}
