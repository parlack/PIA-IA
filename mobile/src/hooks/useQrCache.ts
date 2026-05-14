/**
 * Cache local del token QR (24h) usando AsyncStorage.
 *
 * Paridad con `useQrCache.ts` del frontend web. Permite que el modal abra
 * instantaneamente cuando el usuario ya ha generado un QR vigente, sin volver
 * a pegarle al backend.
 *
 * Claves: `pia_qr_<CURP>` -> { token, qrSrc, expiraEn }
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'pia_qr_'
const DURACION_MS = 24 * 60 * 60 * 1000

export interface QrCacheEntry {
  token:     string
  qrSrc:     string
  expiraEn:  number
}

function key(curp: string): string {
  return `${PREFIX}${curp}`
}

export const qrCache = {
  async leer(curp: string): Promise<QrCacheEntry | null> {
    if (!curp) return null
    try {
      const raw = await AsyncStorage.getItem(key(curp))
      if (!raw) return null
      const parsed = JSON.parse(raw) as QrCacheEntry
      if (!parsed?.token || !parsed?.qrSrc || !parsed?.expiraEn) return null
      if (parsed.expiraEn < Date.now()) {
        await AsyncStorage.removeItem(key(curp))
        return null
      }
      return parsed
    } catch {
      return null
    }
  },

  async guardar(
    curp: string,
    token: string,
    qrSrc: string,
    expiraEn?: number,
  ): Promise<QrCacheEntry> {
    const entry: QrCacheEntry = {
      token,
      qrSrc,
      expiraEn: expiraEn && expiraEn > Date.now() ? expiraEn : Date.now() + DURACION_MS,
    }
    if (curp) {
      try {
        await AsyncStorage.setItem(key(curp), JSON.stringify(entry))
      } catch {
        /* silencioso */
      }
    }
    return entry
  },

  async invalidar(curp: string): Promise<void> {
    if (!curp) return
    try {
      await AsyncStorage.removeItem(key(curp))
    } catch {
      /* silencioso */
    }
  },
}
