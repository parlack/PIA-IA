/**
 * Estado compartido del expediente del ciudadano (mobile).
 *
 * Paridad funcional con `useDashboardData` del frontend web. Provee un
 * Context para que multiples screens (dashboard, vacunas, mensajes,
 * alergias, etc.) consuman los mismos datos sin recargar cada vez que el
 * usuario abre el menu y cambia de pestana.
 *
 * Uso:
 *  - Envuelve <DashboardDataProvider> en `app/_layout.tsx`.
 *  - Cada screen llama `useDashboardData()` para leer/disparar `cargar()`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { usuariosApi } from '@/api/usuarios'
import { vacunasApi } from '@/api/vacunas'
import { mensajesApi, type MensajeRow } from '@/api/mensajes'
import { sessionStore } from './useSession'
import type { UsuarioPublico, ResumenVacuna, Alerta } from '@/types'

interface DashboardState {
  loading:         boolean
  loaded:          boolean
  error:           string
  curp:            string
  usuario:         UsuarioPublico | null
  resumen:         ResumenVacuna[]
  alertas:         Alerta[]
  mensajes:        MensajeRow[]
  isNoRegistrado:  boolean
}

const initial: DashboardState = {
  loading: true,
  loaded: false,
  error: '',
  curp: '',
  usuario: null,
  resumen: [],
  alertas: [],
  mensajes: [],
  isNoRegistrado: false,
}

interface DashboardContextValue extends DashboardState {
  pendientes:           ResumenVacuna[]
  completadas:          number
  porcentaje:           number
  noLeidos:             number
  alertasAlta:          Alerta[]
  cargar:               (forzar?: boolean) => Promise<void>
  invalidar:            () => void
  eliminarMensajeLocal: (id: number) => void
  marcarLeidoLocal:     (id: number) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(initial)
  const cargandoRef = useRef(false)

  const cargar = useCallback(async (forzar = false) => {
    const curpActual = (await sessionStore.getCurp()) || ''
    const noReg = await sessionStore.isNoRegistrado()

    // CURP cambio (logout + nuevo login) -> invalidamos cache.
    const debeRecargar = forzar || !state.loaded || curpActual !== state.curp

    if (!debeRecargar) return
    if (cargandoRef.current) return
    cargandoRef.current = true

    if (!curpActual) {
      setState({
        ...initial,
        loading: false,
        loaded: true,
        error: 'Sin sesion activa.',
      })
      cargandoRef.current = false
      return
    }

    if (noReg) {
      setState({
        ...initial,
        loading: false,
        loaded: true,
        curp: curpActual,
        isNoRegistrado: true,
      })
      cargandoRef.current = false
      return
    }

    setState(s => ({ ...s, loading: true, error: '' }))
    try {
      const [user, hist, alert, msg] = await Promise.all([
        usuariosApi.getMe(curpActual),
        vacunasApi.getHistorial(curpActual),
        vacunasApi.getAlertas(curpActual).catch(() => ({ alertas: [], grupo_prioritario: 'ninguno' })),
        mensajesApi.getMensajes(curpActual).catch(() => [] as MensajeRow[]),
      ])
      setState({
        loading: false,
        loaded: true,
        error: '',
        curp: curpActual,
        usuario: user,
        resumen: hist.resumen ?? [],
        alertas: alert.alertas ?? [],
        mensajes: Array.isArray(msg) ? msg : [],
        isNoRegistrado: false,
      })
    } catch (e) {
      setState(s => ({
        ...s,
        loading: false,
        loaded: true,
        error: e instanceof Error ? e.message : 'No se pudo cargar.',
      }))
    } finally {
      cargandoRef.current = false
    }
  }, [state.curp, state.loaded])

  const invalidar = useCallback(() => {
    setState(s => ({ ...s, loaded: false }))
  }, [])

  const eliminarMensajeLocal = useCallback((id: number) => {
    setState(s => ({ ...s, mensajes: s.mensajes.filter(m => m.id !== id) }))
  }, [])

  const marcarLeidoLocal = useCallback((id: number) => {
    setState(s => ({
      ...s,
      mensajes: s.mensajes.map(m => m.id === id ? { ...m, leido: 1 } : m),
    }))
  }, [])

  const value = useMemo<DashboardContextValue>(() => {
    const completadas = state.resumen.filter(v => v.completa).length
    const porcentaje = state.resumen.length
      ? Math.round((completadas / state.resumen.length) * 100)
      : 0
    return {
      ...state,
      completadas,
      porcentaje,
      pendientes:  state.resumen.filter(v => !v.completa),
      noLeidos:    state.mensajes.filter(m => !m.leido).length,
      alertasAlta: state.alertas.filter(a => a.prioridad === 'alta'),
      cargar,
      invalidar,
      eliminarMensajeLocal,
      marcarLeidoLocal,
    }
  }, [state, cargar, invalidar, eliminarMensajeLocal, marcarLeidoLocal])

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardData(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error(
      'useDashboardData debe usarse dentro de <DashboardDataProvider>. ' +
      'Verifica que app/_layout.tsx lo envuelva.',
    )
  }
  return ctx
}
