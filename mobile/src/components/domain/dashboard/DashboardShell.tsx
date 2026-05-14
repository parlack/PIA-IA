/**
 * Wrapper para todas las screens del expediente en mobile.
 *
 * - Header sticky con boton de menu (abre Drawer) y logo.
 * - Estados centralizados: cargando, no-registrado, error.
 * - Botton sheet "Mi QR" usable desde cualquier screen.
 *
 * Cada screen pasa su contenido via prop `children` y opcionalmente
 * `onOpenQr` para mostrar boton de QR en el header (default true).
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { NavIcon } from '@/components/ui/NavIcon'
import { DashboardSkeleton } from '@/components/domain/DashboardSkeleton'
import { MiQrModal } from '@/components/domain/MiQrModal'

import { useDashboardData } from '@/hooks/useDashboardData'
import { sessionStore } from '@/hooks/useSession'
import { colors, spacing } from '@/theme'

interface Props {
  children:  ReactNode
  /** Mostrar boton de Mi QR en el header. Default: true */
  showQr?:   boolean
}

export function DashboardShell({ children, showQr = true }: Props) {
  const { loading, error, isNoRegistrado, curp, cargar } = useDashboardData()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mostrarQr, setMostrarQr] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    (async () => {
      const c = await sessionStore.getCurp()
      if (!c) {
        router.replace('/login')
        return
      }
      cargar()
    })()
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
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Text variant="eyebrow" color="muted">CURP no encontrada</Text>
          <Text variant="display" style={{ marginTop: spacing.md }}>
            Esta cartilla{'\n'}<Text variant="display" italic>aun no existe.</Text>
          </Text>
          <Text variant="body" color="muted" style={{ marginTop: spacing.lg }}>
            Tu CURP es valida pero no esta registrada. Acude a tu UMF para crear tu expediente.
          </Text>
          <Button label="Volver al inicio" variant="ghost" onPress={handleLogout} style={{ marginTop: spacing.xl }} />
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, padding: spacing.xl }}>
        <Text variant="eyebrow" color="wine">Error</Text>
        <Text variant="h1" style={{ marginTop: spacing.sm }}>{error}</Text>
        <Button label="Cerrar sesion" variant="ghost" onPress={handleLogout} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
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

        <Image
          source={require('../../../../assets/pia-logo.png')}
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />

        {showQr && curp ? (
          <Pressable
            onPress={() => setMostrarQr(true)}
            accessibilityRole="button"
            accessibilityLabel="Mi QR"
            hitSlop={10}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text variant="mono" style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' }}>
              Mi QR
            </Text>
            <Text style={{ fontSize: 14 }}>▣</Text>
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.moss}
          />
        }
      >
        {children}
      </ScrollView>

      <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {curp ? (
        <MiQrModal visible={mostrarQr} onClose={() => setMostrarQr(false)} curp={curp} />
      ) : null}
    </SafeAreaView>
  )
}
