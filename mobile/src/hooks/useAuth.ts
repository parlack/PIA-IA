import { useState } from 'react'
import { authApi } from '@/api/auth'
import { sessionStore } from './useSession'
import { normalizarCurp, esCurpValida } from '@/utils/curp'
import type { ApiError } from '@/api/client'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login(curpRaw: string, password?: string): Promise<'autenticado' | 'basico' | 'no_registrado' | 'error'> {
    setError('')
    const curp = normalizarCurp(curpRaw)
    if (!esCurpValida(curp)) {
      setError('Formato de CURP invalido.')
      return 'error'
    }
    setLoading(true)
    try {
      const res = await authApi.login(curp, password)
      await sessionStore.persistLogin({
        autenticado: res.autenticado,
        curp: res.curp,
        nombre: res.nombre,
        apellido_paterno: res.apellido_paterno,
        rol: res.rol,
      })
      return res.autenticado ? 'autenticado' : 'basico'
    } catch (e) {
      const apiErr = e as ApiError
      if (apiErr.data?.registrable) {
        await sessionStore.persistNoRegistrado(curp)
        return 'no_registrado'
      }
      setError(apiErr.message || 'No se pudo iniciar sesion.')
      return 'error'
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}
