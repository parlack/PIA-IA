/**
 * Capa unica para manejar estado de sesion en localStorage.
 * Las paginas NO deben tocar localStorage directamente, deben pasar por aqui.
 */
import { normalizarRolParaStorage } from '~/utils/rol'

const KEYS = {
  auth: 'auth',
  curp: 'curp',
  rol: 'rol',
  userName: 'userName',
  noRegistrado: 'noRegistrado',
} as const

export const useSession = () => {
  function getStored<K extends keyof typeof KEYS>(key: K): string | null {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(KEYS[key])
  }

  function setStored<K extends keyof typeof KEYS>(key: K, value: string): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(KEYS[key], value)
  }

  function clearAll(): void {
    if (typeof localStorage === 'undefined') return
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  }

  return {
    getCurp: () => getStored('curp'),
    getRol:  () => normalizarRolParaStorage(getStored('rol')),
    getUserName: () => getStored('userName'),

    isAuthenticated: () => getStored('auth') === 'true',
    isBasicSession:  () => getStored('auth') === 'false' && !!getStored('curp'),
    isNoRegistrado:  () => getStored('noRegistrado') === 'true',
    hasSession:      () => getStored('auth') !== null,

    persistLogin(payload: {
      autenticado: boolean
      curp: string
      nombre?: string
      apellido_paterno?: string
      rol?: string
    }) {
      setStored('auth', payload.autenticado ? 'true' : 'false')
      setStored('curp', payload.curp)
      setStored('rol', normalizarRolParaStorage(payload.rol ?? null))
      const display = [payload.nombre, payload.apellido_paterno].filter(Boolean).join(' ').trim()
      if (display) setStored('userName', display)
    },

    persistNoRegistrado(curp: string) {
      setStored('auth', 'false')
      setStored('curp', curp)
      setStored('rol', 'usuario')
      setStored('noRegistrado', 'true')
    },

    upgradeToAuth() {
      setStored('auth', 'true')
    },

    setUserName(name: string) {
      setStored('userName', name)
    },

    setRol(rol: string) {
      setStored('rol', normalizarRolParaStorage(rol))
    },

    logout: clearAll,
  }
}
