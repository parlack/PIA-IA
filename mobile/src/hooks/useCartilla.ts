import { useCallback, useEffect, useState } from 'react'
import { usuariosApi } from '@/api/usuarios'
import { vacunasApi } from '@/api/vacunas'
import { sessionStore } from './useSession'
import type { UsuarioPublico, ResumenVacuna, Alerta } from '@/types'

interface CartillaState {
  loading: boolean
  error: string
  curp: string
  usuario: UsuarioPublico | null
  resumen: ResumenVacuna[]
  alertas: Alerta[]
  isNoRegistrado: boolean
}

export function useCartilla() {
  const [state, setState] = useState<CartillaState>({
    loading: true,
    error: '',
    curp: '',
    usuario: null,
    resumen: [],
    alertas: [],
    isNoRegistrado: false,
  })

  const cargar = useCallback(async () => {
    const curp = await sessionStore.getCurp()
    const noReg = await sessionStore.isNoRegistrado()

    if (!curp) {
      setState((s) => ({ ...s, loading: false, error: 'Sin sesion activa.' }))
      return
    }

    if (noReg) {
      setState({
        loading: false, error: '', curp,
        usuario: null, resumen: [], alertas: [], isNoRegistrado: true,
      })
      return
    }

    try {
      const [user, hist, alert] = await Promise.all([
        usuariosApi.getMe(curp),
        vacunasApi.getHistorial(curp),
        vacunasApi.getAlertas(curp).catch(() => ({ alertas: [], grupo_prioritario: 'ninguno' })),
      ])
      setState({
        loading: false, error: '', curp,
        usuario: user,
        resumen: hist.resumen ?? [],
        alertas: alert.alertas ?? [],
        isNoRegistrado: false,
      })
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'No se pudo cargar.',
      }))
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { ...state, recargar: cargar }
}
