/**
 * Tab Vacunas: lista detallada del esquema completo del ciudadano.
 *
 * Usa `useDashboardData` (estado compartido) y el componente modular
 * `VacunasTable` con filtro de busqueda. Mantiene el banner de alertas
 * prioritarias en la parte superior.
 */
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/components/ui/Text'
import { Alert } from '@/components/ui/Alert'
import { Drawer } from '@/components/ui/Drawer'
import { DashboardSkeleton } from '@/components/domain/DashboardSkeleton'
import { VacunasPrioritarias } from '@/components/domain/dashboard/VacunasPrioritarias'
import { VacunasTable } from '@/components/domain/dashboard/VacunasTable'
import { useFloatingTabBarHeight } from '@/components/navigation/FloatingTabBar'

import { useDashboardData } from '@/hooks/useDashboardData'
import { colors, spacing } from '@/theme'

export default function VacunasTab() {
  const tabBarH = useFloatingTabBarHeight()
  const { loading, error, resumen, alertasAlta, isNoRegistrado, cargar } = useDashboardData()
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

  if (loading && !refreshing) return <DashboardSkeleton />

  if (isNoRegistrado) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, padding: spacing.xl }}>
        <Text variant="eyebrow" color="muted">Sin esquema</Text>
        <Text variant="h1" style={{ marginTop: spacing.sm }}>Cartilla no registrada</Text>
        <Text variant="body" color="muted" style={{ marginTop: spacing.md }}>
          Acude a tu UMF para crear tu expediente.
        </Text>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, padding: spacing.xl }}>
        <Alert tipo="error" titulo="Error" mensaje={error} />
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
        contentContainerStyle={{ padding: spacing.xl, paddingTop: 0, paddingBottom: tabBarH + spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.moss} />}
      >
        <View
          style={{
            borderBottomWidth: 2,
            borderBottomColor: colors.ink,
            paddingBottom: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <Text variant="eyebrow" color="muted">Esquema nacional</Text>
          <Text variant="display" style={{ marginTop: spacing.sm }}>
            Mis{' '}<Text variant="display" italic>vacunas.</Text>
          </Text>
        </View>

        <VacunasPrioritarias alertas={alertasAlta} />

        <VacunasTable resumen={resumen} />

        <View>
          <Text variant="eyebrow" color="muted">Total catalogo</Text>
          <Text variant="h2" style={{ marginTop: spacing.xs }}>{resumen.length} vacunas</Text>
        </View>
      </ScrollView>

      <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  )
}
