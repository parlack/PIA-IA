/**
 * Cola offline para dosis aplicadas.
 *
 * Cuando el admin escanea el QR y la red falla, guardamos la dosis con todos los
 * datos del ciudadano (curp_paciente + datos de la aplicacion) y al recuperar
 * conexion la enviamos via POST /vacunas/historial (no por token, para evitar
 * tokens caducados despues de horas sin red).
 *
 * Almacenamiento: AsyncStorage con clave 'dosis_pendientes'.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import { adminApi } from '@/api/admin'

const KEY = 'dosis_pendientes'

export interface DosisPendiente {
  id: string                   // uuid local para deduplicar
  creado_en: string            // ISO datetime de cuando se encolo
  curp_usuario: string
  vacuna_id: number
  numero_dosis: number
  fecha_aplicacion: string     // AAAA-MM-DD
  lugar_aplicacion?: string
  lote?: string
  actor_curp: string
  // metadatos para el UI
  paciente_nombre: string
  vacuna_nombre: string
}

type Listener = (items: DosisPendiente[]) => void

const listeners = new Set<Listener>()

function localId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

async function read(): Promise<DosisPendiente[]> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is DosisPendiente =>
      x && typeof x.id === 'string' && typeof x.curp_usuario === 'string',
    )
  } catch {
    return []
  }
}

async function write(items: DosisPendiente[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items))
  notify(items)
}

function notify(items: DosisPendiente[]) {
  for (const l of listeners) {
    try { l(items) } catch { /* ignorar */ }
  }
}

export const offlineQueue = {
  subscribe(l: Listener): () => void {
    listeners.add(l)
    return () => listeners.delete(l)
  },

  async list(): Promise<DosisPendiente[]> {
    return await read()
  },

  async enqueue(input: Omit<DosisPendiente, 'id' | 'creado_en'>): Promise<DosisPendiente> {
    const items = await read()
    const item: DosisPendiente = {
      ...input,
      id: localId(),
      creado_en: new Date().toISOString(),
    }
    items.push(item)
    await write(items)
    return item
  },

  async remove(id: string): Promise<void> {
    const items = await read()
    const next = items.filter((x) => x.id !== id)
    await write(next)
  },

  /**
   * Intenta enviar todas las dosis pendientes via POST /vacunas/historial.
   * Devuelve un resumen { ok, fallidos } y elimina las que se enviaron.
   */
  async flush(): Promise<{ ok: number; fallidos: number; mensaje?: string }> {
    const items = await read()
    if (!items.length) return { ok: 0, fallidos: 0 }

    let ok = 0
    let fallidos = 0
    let mensaje: string | undefined
    const restantes: DosisPendiente[] = []

    for (const it of items) {
      try {
        await adminApi.registrarDosis({
          curp_usuario:     it.curp_usuario,
          vacuna_id:        it.vacuna_id,
          numero_dosis:     it.numero_dosis,
          fecha_aplicacion: it.fecha_aplicacion,
          lugar_aplicacion: it.lugar_aplicacion,
          lote:             it.lote,
        })
        ok++
      } catch (e) {
        fallidos++
        if (!mensaje) mensaje = e instanceof Error ? e.message : 'Error de red'
        restantes.push(it)
      }
    }

    await write(restantes)
    return { ok, fallidos, mensaje }
  },

  async clearAll(): Promise<void> {
    await write([])
  },
}
