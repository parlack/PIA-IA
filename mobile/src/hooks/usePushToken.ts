/**
 * Registra el dispositivo para push notifications con Expo y notifica al backend.
 *
 * NOTA SDK 55:
 *   A partir de Expo SDK 53 las push remotas en Android fueron removidas de
 *   Expo Go. Desde SDK 55, expo-notifications LANZA un error explicito si
 *   se intenta usar push remoto dentro de Expo Go. Por eso este hook
 *   detecta el entorno con expo-constants y solo intenta registrar el
 *   push token cuando estamos en un development build / standalone build.
 *
 *   En Expo Go la app simplemente NO registra push (sin error ni log
 *   ruidoso). Para tener push reales se necesita un EAS development build:
 *     npx eas build --profile development --platform android
 *
 * Falla silenciosamente si expo-notifications no esta disponible o el
 * usuario rechaza permisos.
 */
import { useEffect } from 'react'
import { Platform } from 'react-native'
import Constants, { ExecutionEnvironment } from 'expo-constants'

import { authApi } from '@/api/auth'
import { sessionStore } from './useSession'

let registroEnCurso = false
let yaRegistrado = false

/**
 * Detecta si la app se esta ejecutando dentro de Expo Go (storeClient).
 * En ese caso, las push remotas no estan disponibles y debemos saltar el registro.
 */
function corriendoEnExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient
}

export function usePushToken(curp: string | null | undefined) {
  useEffect(() => {
    if (!curp || yaRegistrado || registroEnCurso) return

    if (corriendoEnExpoGo()) {
      // Push remotas no soportadas en Expo Go (SDK 53+). Salir limpio sin tocar
      // expo-notifications para evitar el error explicito de SDK 55.
      return
    }

    registroEnCurso = true
    ;(async () => {
      try {
        const Notifications = await import('expo-notifications').catch(() => null)
        const Device = await import('expo-device').catch(() => null)
        if (!Notifications || !Device) return

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'PIA-IA',
            importance: 4,
          } as any)
        }

        const isDevice = (Device as any).isDevice
        if (!isDevice) return

        const existing = await Notifications.getPermissionsAsync()
        let status = existing.status
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync()
          status = req.status
        }
        if (status !== 'granted') return

        const tokenData = await Notifications.getExpoPushTokenAsync()
        const token = (tokenData as any).data
        if (!token) return

        await authApi.registrarPushToken(curp, token)
        yaRegistrado = true
      } catch {
        // silencioso: dev en simulador, paquete ausente, permiso denegado, etc.
      } finally {
        registroEnCurso = false
      }
    })()
  }, [curp])
}

export async function limpiarRegistroPush() {
  yaRegistrado = false
  await sessionStore.getCurp()
}
