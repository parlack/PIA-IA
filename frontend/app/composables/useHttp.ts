/**
 * Cliente HTTP base. Maneja serializacion, headers y formato de errores.
 * Todos los composables de dominio deben usar este, no `fetch` directo.
 *
 * BASE_URL se resuelve desde runtimeConfig.public.apiBase (configurable por env
 * `NUXT_PUBLIC_API_BASE`) y cae a `http://localhost:8000` en dev.
 */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface HttpError extends Error {
  status?: number
  data?: Record<string, unknown>
}

export const useHttp = () => {
  const config = useRuntimeConfig()
  const BASE_URL = (config.public.apiBase as string) || 'http://localhost:8000'

  async function request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      const detail = payload.detail
      if (typeof detail === 'object' && detail !== null && !Array.isArray(detail)) {
        const e: HttpError = new Error(detail.message ?? 'Error en el servidor')
        e.status = res.status
        e.data = detail
        throw e
      }
      const msg = Array.isArray(detail)
        ? detail.map((x: { msg?: string }) => x?.msg ?? String(x)).join('; ')
        : (typeof detail === 'string' ? detail : 'Error en el servidor')
      const e: HttpError = new Error(msg)
      e.status = res.status
      throw e
    }
    return res.json() as Promise<T>
  }

  return {
    get:    <T>(path: string) => request<T>('GET', path),
    post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
    BASE_URL,
  }
}
