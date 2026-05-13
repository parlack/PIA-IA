/**
 * Hook unico para manejar la sesion. Los screens NO deben tocar AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  auth: 'auth',
  curp: 'curp',
  rol:  'rol',
  userName: 'userName',
  noRegistrado: 'noRegistrado',
} as const

async function getItem(k: string) {
  return await AsyncStorage.getItem(k)
}

async function setItem(k: string, v: string) {
  await AsyncStorage.setItem(k, v)
}

async function removeAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS))
}

export const sessionStore = {
  async getCurp() {
    return await getItem(KEYS.curp)
  },

  async getUserName() {
    return await getItem(KEYS.userName)
  },

  async isAuthenticated() {
    return (await getItem(KEYS.auth)) === 'true'
  },

  async isBasicSession() {
    const auth = await getItem(KEYS.auth)
    const curp = await getItem(KEYS.curp)
    return auth === 'false' && !!curp
  },

  async isNoRegistrado() {
    return (await getItem(KEYS.noRegistrado)) === 'true'
  },

  async persistLogin(payload: {
    autenticado: boolean
    curp: string
    nombre?: string
    apellido_paterno?: string
    rol?: string
  }) {
    await setItem(KEYS.auth, payload.autenticado ? 'true' : 'false')
    await setItem(KEYS.curp, payload.curp)
    await setItem(KEYS.rol, payload.rol ?? 'usuario')
    const display = [payload.nombre, payload.apellido_paterno].filter(Boolean).join(' ').trim()
    if (display) await setItem(KEYS.userName, display)
    await AsyncStorage.removeItem(KEYS.noRegistrado)
  },

  async persistNoRegistrado(curp: string) {
    await setItem(KEYS.auth, 'false')
    await setItem(KEYS.curp, curp)
    await setItem(KEYS.rol, 'usuario')
    await setItem(KEYS.noRegistrado, 'true')
  },

  async logout() {
    await removeAll()
  },
}
