/**
 * Layout del grupo (tabs) - experiencia del ciudadano.
 *
 * Guard:
 *   - Sin sesion -> /login.
 *   - Sesion con rol admin -> /admin (los admins no usan tab bar).
 *
 * Las rutas hijas viven en /inicio, /vacunas, /qr, /perfil sin prefijo
 * porque el grupo "(tabs)" no agrega segmento a la URL.
 */
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Tabs, router } from 'expo-router'

import { FloatingTabBar } from '@/components/navigation/FloatingTabBar'
import { sessionStore } from '@/hooks/useSession'
import { colors } from '@/theme'

export default function TabsLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    (async () => {
      const admin = await sessionStore.isAdmin()
      if (admin) {
        router.replace('/admin')
        return
      }
      const curp = await sessionStore.getCurp()
      if (!curp) {
        router.replace('/login')
        return
      }
      setReady(true)
    })()
  }, [])

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="inicio"  options={{ title: 'Inicio' }} />
      <Tabs.Screen name="vacunas" options={{ title: 'Vacunas' }} />
      <Tabs.Screen name="qr"      options={{ title: 'Mi QR' }} />
      <Tabs.Screen name="perfil"  options={{ title: 'Perfil' }} />
    </Tabs>
  )
}
