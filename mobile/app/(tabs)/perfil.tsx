/**
 * Tab Perfil: datos del ciudadano, alergias, AEFI, unidad medica y cerrar sesion.
 */
import { useCallback, useEffect, useState } from 'react'
import { ScrollView, View, RefreshControl, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Drawer } from '@/components/ui/Drawer'
import { GrupoBadge } from '@/components/domain/GrupoBadge'
import { AlergiasSection } from '@/components/domain/AlergiasSection'
import { AefiSection } from '@/components/domain/AefiSection'
import { DashboardSkeleton } from '@/components/domain/DashboardSkeleton'
import { useFloatingTabBarHeight } from '@/components/navigation/FloatingTabBar'

import { useDashboardData } from '@/hooks/useDashboardData'
import { sessionStore } from '@/hooks/useSession'
import { colors, spacing } from '@/theme'

export default function PerfilTab() {
  const tabBarH = useFloatingTabBarHeight()
  const { loading, error, curp, usuario, isNoRegistrado, cargar } = useDashboardData()
  const [refreshing, setRefreshing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  if (loading && !refreshing) return <DashboardSkeleton />

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, padding: spacing.xl }}>
        <Alert tipo="error" titulo="Error" mensaje={error} />
        <Button label="Cerrar sesion" variant="ghost" onPress={handleLogout} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
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
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingTop: 0, paddingBottom: tabBarH + spacing.lg, gap: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.moss} />}
      >
        {/* Hero */}
        <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, paddingBottom: spacing.lg }}>
          <Text variant="eyebrow" color="muted">Mi cuenta</Text>
          <Text variant="display" style={{ marginTop: spacing.sm }}>
            Perfil{'\n'}<Text variant="display" italic>personal.</Text>
          </Text>
        </View>

        {/* Datos del usuario */}
        {usuario ? (
          <View style={{ gap: spacing.xs }}>
            <Text variant="eyebrow" color="muted">Nombre</Text>
            <Text variant="h2">{usuario.nombre} {usuario.apellido_paterno}</Text>
            {usuario.apellido_materno ? (
              <Text variant="body" color="muted">{usuario.apellido_materno}</Text>
            ) : null}

            <View style={{ marginTop: spacing.md }}>
              <Text variant="eyebrow" color="muted">CURP</Text>
              <View style={{ marginTop: spacing.xs, backgroundColor: colors.bone, paddingHorizontal: spacing.sm, paddingVertical: 6, alignSelf: 'flex-start' }}>
                <Text variant="mono" style={{ fontSize: 12, letterSpacing: 1.2 }}>{curp}</Text>
              </View>
            </View>

            {usuario.grupo_prioritario ? (
              <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="eyebrow" color="muted">Grupo:</Text>
                <GrupoBadge grupo={usuario.grupo_prioritario} />
              </View>
            ) : null}

            {usuario.correo ? (
              <View style={{ marginTop: spacing.md }}>
                <Text variant="eyebrow" color="muted">Correo</Text>
                <Text variant="body" style={{ marginTop: 2 }}>{usuario.correo}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Unidad medica */}
        {usuario?.unidad_nombre ? (
          <View style={{ marginTop: spacing.xl }}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.md }}>
              <Text variant="h2">Unidad medica</Text>
            </View>
            <Text variant="eyebrow" color="muted">Unidad</Text>
            <Text variant="body" bold style={{ marginTop: 2 }}>{usuario.unidad_nombre}</Text>
            {usuario.unidad_telefono ? (
              <>
                <Text variant="eyebrow" color="muted" style={{ marginTop: spacing.md }}>Telefono</Text>
                <Text variant="mono" style={{ marginTop: 2 }}>{usuario.unidad_telefono}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        {/* Alergias */}
        {curp && !isNoRegistrado ? <AlergiasSection curp={curp} editable /> : null}

        {/* AEFI */}
        {curp && !isNoRegistrado ? <AefiSection curp={curp} /> : null}

        {/* Cerrar sesion */}
        <View style={{ marginTop: spacing.xxl, gap: spacing.sm }}>
          <Button label="Cerrar sesion" variant="ghost" onPress={handleLogout} />
        </View>
      </ScrollView>

      <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  )
}
