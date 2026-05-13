/**
 * Cache local del token QR del usuario.
 *
 * El backend genera un token QR firmado con caducidad (24h). Para evitar
 * pegarle al servidor cada vez que el usuario abre el modal, guardamos el
 * token + la URL de la imagen del QR en localStorage con un timestamp de
 * expiracion.
 *
 * Estructura por CURP en localStorage:
 *   pia_qr_<CURP> = { token, qrSrc, expiraEn }
 *
 * - `expiraEn` esta en milisegundos desde epoch.
 * - Si el cache esta vencido se retorna null y la pagina debe regenerar.
 * - El cache se invalida al cerrar sesion (useSession.logout limpia todo
 *   el localStorage relevante de la sesion).
 */

const PREFIX = 'pia_qr_'
const DURACION_MS = 24 * 60 * 60 * 1000

export type QrCacheEntry = {
  token: string
  qrSrc: string
  expiraEn: number
}

function storageDisponible(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

function key(curp: string): string {
  return `${PREFIX}${curp}`
}

export const useQrCache = () => {
  function leer(curp: string): QrCacheEntry | null {
    if (!storageDisponible() || !curp) return null
    try {
      const raw = window.localStorage.getItem(key(curp))
      if (!raw) return null
      const parsed = JSON.parse(raw) as QrCacheEntry
      if (!parsed?.token || !parsed?.qrSrc || !parsed?.expiraEn) return null
      if (parsed.expiraEn < Date.now()) {
        window.localStorage.removeItem(key(curp))
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  function guardar(curp: string, token: string, qrSrc: string): QrCacheEntry {
    const entry: QrCacheEntry = {
      token,
      qrSrc,
      expiraEn: Date.now() + DURACION_MS,
    }
    if (storageDisponible() && curp) {
      try {
        window.localStorage.setItem(key(curp), JSON.stringify(entry))
      } catch {
        /* quota llena o storage deshabilitado: silencioso */
      }
    }
    return entry
  }

  function invalidar(curp: string): void {
    if (!storageDisponible() || !curp) return
    try {
      window.localStorage.removeItem(key(curp))
    } catch {
      /* silencioso */
    }
  }

  function tiempoRestanteMs(entry: QrCacheEntry | null): number {
    if (!entry) return 0
    return Math.max(0, entry.expiraEn - Date.now())
  }

  return { leer, guardar, invalidar, tiempoRestanteMs }
}
