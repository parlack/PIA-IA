import { useState } from 'react'
import { authApi } from '@/api/auth'
import { sessionStore } from './useSession'
import { normalizarCurp, esCurpValida } from '@/utils/curp'
import { normalizarRolParaStorage } from '@/utils/rol'
import type { ApiError } from '@/api/client'

export type LoginEstado = 'autenticado' | 'basico' | 'no_registrado' | 'error'

export interface LoginResultado {
  estado: LoginEstado
  rol: string
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login(curpRaw: string, password?: string): Promise<LoginResultado> {
    setError('')
    const curp = normalizarCurp(curpRaw)
    if (!esCurpValida(curp)) {
      setError('Formato de CURP invalido.')
      return { estado: 'error', rol: 'usuario' }
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
      return {
        estado: res.autenticado ? 'autenticado' : 'basico',
        rol: normalizarRolParaStorage(res.rol),
      }
    } catch (e) {
      const apiErr = e as ApiError
      if (apiErr.data?.registrable) {
        await sessionStore.persistNoRegistrado(curp)
        return { estado: 'no_registrado', rol: 'usuario' }
      }
      setError(apiErr.message || 'No se pudo iniciar sesion.')
      return { estado: 'error', rol: 'usuario' }
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}
