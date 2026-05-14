/**
 * Hook para conectarse a la cola offline de dosis.
 *
 * - Expone la lista de pendientes (reactiva).
 * - Detecta cambios de conectividad y auto-vaciado.
 * - Permite forzar flush manualmente.
 */
import { useCallback, useEffect, useState } from 'react'
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'

import { offlineQueue, type DosisPendiente } from '@/utils/offlineQueue'

export interface UseOfflineQueueResult {
  pendientes: DosisPendiente[]
  online: boolean
  flush: () => Promise<{ ok: number; fallidos: number; mensaje?: string }>
}

export function useOfflineQueue(): UseOfflineQueueResult {
  const [pendientes, setPendientes] = useState<DosisPendiente[]>([])
  const [online, setOnline] = useState<boolean>(true)
  const [flushing, setFlushing] = useState(false)

  useEffect(() => {
    let mounted = true
    offlineQueue.list().then((items) => {
      if (mounted) setPendientes(items)
    })
    const unsub = offlineQueue.subscribe((items) => {
      if (mounted) setPendientes(items)
    })
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  useEffect(() => {
    const onChange = (state: NetInfoState) => {
      const isOnline = !!(state.isConnected && state.isInternetReachable !== false)
      setOnline(isOnline)
      if (isOnline && !flushing) {
        setFlushing(true)
        offlineQueue.flush().finally(() => setFlushing(false))
      }
    }
    NetInfo.fetch().then(onChange)
    const unsub = NetInfo.addEventListener(onChange)
    return () => unsub()
    // flushing intentionalmente fuera de deps: si esta corriendo, NetInfo ya volvera a triggerar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flush = useCallback(async () => {
    if (flushing) return { ok: 0, fallidos: 0, mensaje: 'En proceso' }
    setFlushing(true)
    try {
      return await offlineQueue.flush()
    } finally {
      setFlushing(false)
    }
  }, [flushing])

  return { pendientes, online, flush }
}
