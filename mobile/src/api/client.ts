/**
 * Cliente HTTP base. Centraliza error handling y formato de detalle.
 */
const BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000'

export interface ApiError extends Error {
  status?: number
  data?: Record<string, unknown>
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    const detail = payload.detail
    if (typeof detail === 'object' && detail !== null && !Array.isArray(detail)) {
      const e: ApiError = new Error((detail as { message?: string }).message ?? 'Error en el servidor')
      e.status = res.status
      e.data = detail as Record<string, unknown>
      throw e
    }
    const msg = Array.isArray(detail)
      ? detail.map((x: { msg?: string }) => x?.msg ?? String(x)).join('; ')
      : (typeof detail === 'string' ? detail : 'Error en el servidor')
    const e: ApiError = new Error(msg)
    e.status = res.status
    throw e
  }
  return res.json() as Promise<T>
}

export const apiClient = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  BASE,
}
