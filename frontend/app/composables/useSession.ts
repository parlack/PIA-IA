/**
 * Capa unica para manejar estado de sesion en localStorage.
 * Las paginas NO deben tocar localStorage directamente, deben pasar por aqui.
 */
import { esRolAdmin, esRolMedico, normalizarRolParaStorage } from '~/utils/rol'

const KEYS = {
  auth: 'auth',
  curp: 'curp',
  rol: 'rol',
  userName: 'userName',
  noRegistrado: 'noRegistrado',
  aceptoTerminos: 'aceptoTerminos',
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
    // Tambien limpiamos cualquier cache derivado de la sesion (QR, etc).
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith('pia_qr_')) localStorage.removeItem(k)
      }
    } catch {
      /* silencioso */
    }
  }

  return {
    getCurp: () => getStored('curp'),
    getRol:  () => normalizarRolParaStorage(getStored('rol')),
    getUserName: () => getStored('userName'),

    isAuthenticated: () => getStored('auth') === 'true',
    isBasicSession:  () => getStored('auth') === 'false' && !!getStored('curp'),
    isNoRegistrado:  () => getStored('noRegistrado') === 'true',
    hasSession:      () => getStored('auth') !== null,
    isAdmin:         () => esRolAdmin(getStored('rol')),
    isMedico:        () => esRolMedico(getStored('rol')),

    persistLogin(payload: {
      autenticado: boolean
      curp: string
      nombre?: string
      apellido_paterno?: string
      rol?: string
      acepto_terminos?: boolean
    }) {
      setStored('auth', payload.autenticado ? 'true' : 'false')
      setStored('curp', payload.curp)
      setStored('rol', normalizarRolParaStorage(payload.rol ?? null))
      const display = [payload.nombre, payload.apellido_paterno].filter(Boolean).join(' ').trim()
      if (display) setStored('userName', display)
      setStored('aceptoTerminos', payload.acepto_terminos ? 'true' : 'false')
    },

    haAceptadoTerminos: () => getStored('aceptoTerminos') === 'true',
    marcarTerminosAceptados: () => setStored('aceptoTerminos', 'true'),

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
