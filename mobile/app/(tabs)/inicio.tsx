/**
 * Tab Inicio: vista resumen del expediente del ciudadano.
 *
 * Reemplazo del antiguo monolito. Ahora:
 *  - Carga estado via `useDashboardData` (compartido con otras screens).
 *  - Compone modulos pequenos: HeroExpediente, AlertaBanner, StatsGrid,
 *    PendientesList, MensajesList (preview).
 *  - Boton hamburguesa abre Drawer con menu extendido (Mensajes, Alergias,
 *    AEFI, Dependientes, Unidad medica, Admin).
 *  - Acceso rapido a Mi QR fullscreen.
 */
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { AlertaBanner } from '@/components/domain/AlertaBanner'
import { DashboardSkeleton } from '@/components/domain/DashboardSkeleton'
import { HeroExpediente } from '@/components/domain/dashboard/HeroExpediente'
import { StatsGrid } from '@/components/domain/dashboard/StatsGrid'
import { PendientesList } from '@/components/domain/dashboard/PendientesList'
import { MensajesList } from '@/components/domain/dashboard/MensajesList'
import { useFloatingTabBarHeight } from '@/components/navigation/FloatingTabBar'

import { useDashboardData } from '@/hooks/useDashboardData'
import { sessionStore } from '@/hooks/useSession'
import { usePushToken } from '@/hooks/usePushToken'
import { colors, spacing } from '@/theme'

export default function InicioTab() {
  const tabBarH = useFloatingTabBarHeight()
  const {
    loading,
    error,
    curp,
    usuario,
    resumen,
    mensajes,
    alertasAlta,
    pendientes,
    completadas,
    porcentaje,
    noLeidos,
    isNoRegistrado,
    cargar,
  } = useDashboardData()
  const [refreshing, setRefreshing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  usePushToken(curp)

  useEffect(() => {
    cargar()
  }, [cargar])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await cargar(true)
    setRefreshing(false)
  }, [cargar])

  async function handleLogout() {
    await sessionStore.logout()
    router.replace('/login')
  }

  if (loading && !refreshing) {
    return <DashboardSkeleton />
  }

  if (isNoRegistrado) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: tabBarH + spacing.lg }}>
          <Text variant="eyebrow" color="muted">CURP no encontrada</Text>
          <Text variant="display" style={{ marginTop: spacing.md }}>
            Esta cartilla{'\n'}<Text variant="display" italic>aun no existe.</Text>
          </Text>
          <Text variant="body" color="muted" style={{ marginTop: spacing.lg }}>
            Tu CURP es valida pero no esta registrada. Acude a tu UMF para crear tu expediente.
          </Text>
          <Button
            label="Volver al inicio"
            variant="ghost"
            onPress={handleLogout}
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, padding: spacing.xl }}>
        <Text variant="eyebrow" color="wine">Error</Text>
        <Text variant="h1" style={{ marginTop: spacing.sm }}>{error}</Text>
        <Button
          label="Cerrar sesion"
          variant="ghost"
          onPress={handleLogout}
          style={{ marginTop: spacing.xl }}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Top bar: hamburguesa para abrir Drawer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => setDrawerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Text variant="h2" style={{ fontSize: 22 }}>≡</Text>
          <Text variant="mono" style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' }}>
            Menu
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/qr')}
          accessibilityRole="button"
          accessibilityLabel="Mi QR personal"
          hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text variant="mono" style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' }}>
            Mi QR
          </Text>
          <Ionicons name="qr-code-outline" size={14} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingTop: 0, paddingBottom: tabBarH + spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.moss} />}
      >
        <HeroExpediente usuario={usuario} curp={curp} />

        <AlertaBanner alertas={alertasAlta} />

        <StatsGrid
          completadas={completadas}
          totalVacunas={resumen.length}
          pendientes={pendientes.length}
          porcentaje={porcentaje}
          noLeidos={noLeidos}
        />

        {/* CTA Mi QR fullscreen */}
        <Pressable
          onPress={() => router.push('/qr')}
          accessibilityRole="button"
          accessibilityLabel="Mostrar mi QR personal"
          style={({ pressed }) => ({
            marginBottom: spacing.xl,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: pressed ? colors.mossDark : colors.moss,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
          })}
        >
          <View style={{ flex: 1 }}>
            <Text variant="eyebrow" style={{ color: colors.mossSoft, opacity: 0.85 }}>
              VERIFICACION OFICIAL
            </Text>
            <Text variant="h3" color="paper" style={{ marginTop: 2 }}>
              Mostrar mi QR personal
            </Text>
          </View>
          <Ionicons name="qr-code-outline" size={24} color={colors.paper} />
        </Pressable>

        <PendientesList pendientes={pendientes} limit={4} showVerTodo />

        <MensajesList mensajes={mensajes} limit={3} showVerTodo />
      </ScrollView>

      <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  )
}
