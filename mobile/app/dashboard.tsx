import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useCallback } from 'react'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { VacunaRow } from '@/components/domain/VacunaRow'
import { AlertaBanner } from '@/components/domain/AlertaBanner'
import { GrupoBadge } from '@/components/domain/GrupoBadge'

import { useCartilla } from '@/hooks/useCartilla'
import { sessionStore } from '@/hooks/useSession'
import { colors, spacing } from '@/theme'

export default function DashboardScreen() {
  const { loading, error, curp, usuario, resumen, alertas, isNoRegistrado, recargar } = useCartilla()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await recargar()
    setRefreshing(false)
  }, [recargar])

  async function handleLogout() {
    await sessionStore.logout()
    router.replace('/login')
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="eyebrow" color="muted">Cargando</Text>
        <Text variant="h2" style={{ marginTop: spacing.md }}>Preparando tu expediente…</Text>
        <ActivityIndicator color={colors.moss} style={{ marginTop: spacing.lg }} />
      </SafeAreaView>
    )
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

  const completadas = resumen.filter(v => v.completa).length
  const pendientes = resumen.length - completadas
  const porcentaje = resumen.length ? Math.round((completadas / resumen.length) * 100) : 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.moss} />}
      >
        {/* Hero */}
        <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, paddingBottom: spacing.lg, marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text variant="eyebrow" color="muted">Mi cartilla</Text>
              <Text variant="display" style={{ marginTop: spacing.sm }}>
                Cartilla de{'\n'}<Text variant="display" italic>vacunacion.</Text>
              </Text>
              {usuario ? (
                <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <Text variant="small" color="muted">{usuario.nombre} {usuario.apellido_paterno}</Text>
                  <GrupoBadge grupo={usuario.grupo_prioritario} />
                </View>
              ) : null}
            </View>
            <Pressable onPress={handleLogout}>
              <Text variant="eyebrow" color="muted">SALIR ↗</Text>
            </Pressable>
          </View>
          <View style={{ marginTop: spacing.md, backgroundColor: colors.bone, paddingHorizontal: spacing.sm, paddingVertical: 4, alignSelf: 'flex-start' }}>
            <Text variant="mono" style={{ fontSize: 11 }}>{curp}</Text>
          </View>
        </View>

        {/* Alertas */}
        <AlertaBanner alertas={alertas.filter(a => a.prioridad === 'alta')} />

        {/* Stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl, marginBottom: spacing.xxl }}>
          <View style={{ minWidth: '40%' }}>
            <Text variant="eyebrow" color="muted">Completas</Text>
            <Text variant="display" style={{ marginTop: spacing.xs }}>{completadas}</Text>
            <Text variant="small" color="muted">de {resumen.length}</Text>
          </View>
          <View style={{ minWidth: '40%' }}>
            <Text variant="eyebrow" color="muted">Pendientes</Text>
            <Text variant="display" color={pendientes > 0 ? 'wine' : 'ink'} style={{ marginTop: spacing.xs }}>{pendientes}</Text>
            <Text variant="small" color="muted">por aplicar</Text>
          </View>
          <View style={{ minWidth: '40%' }}>
            <Text variant="eyebrow" color="muted">Progreso</Text>
            <Text variant="display" style={{ marginTop: spacing.xs }}>{porcentaje}<Text variant="h2" color="muted">%</Text></Text>
            <View style={{ height: 2, backgroundColor: colors.bone, marginTop: spacing.sm }}>
              <View style={{ height: 2, backgroundColor: porcentaje === 100 ? colors.moss : colors.ink, width: `${porcentaje}%` }} />
            </View>
          </View>
        </View>

        {/* Lista vacunas */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="h2">Vacunas</Text>
          <Text variant="eyebrow" color="muted">{resumen.length} en catalogo</Text>
        </View>

        <View>
          {resumen.map((v, i) => (
            <VacunaRow key={v.vacuna_id} vacuna={v} showDivider={i < resumen.length - 1} />
          ))}
        </View>

        {/* Unidad medica */}
        {usuario?.unidad_nombre ? (
          <View style={{ marginTop: spacing.xxl }}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.lg }}>
              <Text variant="h2">Unidad medica</Text>
            </View>
            <Text variant="eyebrow" color="muted">Unidad</Text>
            <Text variant="body" bold style={{ marginTop: 2, marginBottom: spacing.md }}>{usuario.unidad_nombre}</Text>
            <Text variant="eyebrow" color="muted">Telefono</Text>
            <Text variant="mono" style={{ marginTop: 2 }}>{usuario.unidad_telefono ?? '—'}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
