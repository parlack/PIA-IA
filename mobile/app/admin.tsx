import { useCallback, useEffect, useState } from 'react'
import { View, ScrollView, Pressable, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/components/ui/Text'
import { StatsTab } from '@/components/admin/StatsTab'
import { UsuariosTab } from '@/components/admin/UsuariosTab'
import { CatalogoTab } from '@/components/admin/CatalogoTab'
import { MensajesTab } from '@/components/admin/MensajesTab'
import { ReportesTab } from '@/components/admin/ReportesTab'
import { AefiTab } from '@/components/admin/AefiTab'
import { AuditoriaTab } from '@/components/admin/AuditoriaTab'
import { useToast } from '@/components/ui/Toast'

import { sessionStore } from '@/hooks/useSession'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { colors, spacing } from '@/theme'

type TabKey = 'stats' | 'usuarios' | 'catalogo' | 'mensajes' | 'reportes' | 'aefi' | 'auditoria'

const TABS: { key: TabKey; label: string; num: string }[] = [
  { key: 'stats',     label: 'Stats',      num: '01' },
  { key: 'reportes',  label: 'Reportes',   num: '02' },
  { key: 'usuarios',  label: 'Usuarios',   num: '03' },
  { key: 'catalogo',  label: 'Catalogo',   num: '04' },
  { key: 'aefi',      label: 'AEFI',       num: '05' },
  { key: 'mensajes',  label: 'Mensajes',   num: '06' },
  { key: 'auditoria', label: 'Auditoria',  num: '07' },
]

export default function AdminScreen() {
  const toast = useToast()
  const { pendientes, online, flush } = useOfflineQueue()
  const [tab, setTab] = useState<TabKey>('stats')
  const [nombre, setNombre] = useState('')
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [reintentando, setReintentando] = useState(false)

  async function reintentarPendientes() {
    setReintentando(true)
    try {
      const r = await flush()
      if (r.ok > 0 && r.fallidos === 0) {
        toast.success(`${r.ok} dosis enviadas al servidor.`, 'Sincronizado')
      } else if (r.ok > 0) {
        toast.info(`${r.ok} enviadas, ${r.fallidos} pendientes.`, 'Parcial')
      } else if (r.fallidos > 0) {
        toast.error(r.mensaje ?? 'No se pudo enviar.', 'Sin conexion')
      }
    } finally {
      setReintentando(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    setRefreshKey((k) => k + 1)
    // Pequena ventana para que el RefreshControl no se vea instantaneo
    setTimeout(() => setRefreshing(false), 600)
  }, [])

  useEffect(() => {
    (async () => {
      const admin = await sessionStore.isAdmin()
      const auth = await sessionStore.isAuthenticated()
      if (!admin) {
        router.replace('/inicio')
        return
      }
      if (!auth) {
        router.replace('/login')
        return
      }
      setAuthorized(true)
      const n = await sessionStore.getUserName()
      if (n) setNombre(n)
    })()
  }, [])

  async function handleLogout() {
    await sessionStore.logout()
    router.replace('/login')
  }

  if (authorized !== true) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} />
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.moss}
            colors={[colors.moss]}
          />
        }
      >

        {/* Hero */}
        <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, paddingBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text variant="eyebrow" color="muted">Panel administrativo</Text>
              <Text variant="display" style={{ marginTop: spacing.sm }}>
                Gestion del{'\n'}<Text variant="display" italic>sistema.</Text>
              </Text>
              {nombre ? <Text variant="small" color="muted" style={{ marginTop: spacing.sm }}>{nombre}</Text> : null}
            </View>
            <Pressable onPress={handleLogout} hitSlop={8}>
              <Text variant="eyebrow" color="muted">SALIR ↗</Text>
            </Pressable>
          </View>

          {/* Accion principal: escanear QR */}
          <Pressable
            onPress={() => router.push('/aplicar-qr')}
            style={({ pressed }) => ({
              marginTop: spacing.lg,
              backgroundColor: pressed ? colors.mossDark : colors.moss,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.md,
            })}
            accessibilityRole="button"
            accessibilityLabel="Escanear QR de ciudadano para aplicar dosis"
          >
            <View style={{ flex: 1 }}>
              <Text variant="eyebrow" style={{ color: colors.mossSoft, opacity: 0.85 }}>
                Aplicar dosis · escaneo
              </Text>
              <Text variant="h3" color="paper" style={{ marginTop: 2 }}>
                Escanear QR del ciudadano
              </Text>
            </View>
            <Text variant="mono" color="paper" style={{ fontSize: 22 }}>⟩</Text>
          </Pressable>

          {/* Banner de dosis offline pendientes */}
          {pendientes.length > 0 ? (
            <Pressable
              onPress={reintentando ? undefined : reintentarPendientes}
              style={{
                marginTop: spacing.md,
                borderLeftWidth: 2,
                borderLeftColor: online ? colors.ochre : colors.muted,
                backgroundColor: 'rgba(180,83,9,0.06)',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.md,
                opacity: reintentando ? 0.6 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel={`${pendientes.length} dosis pendientes de enviar`}
            >
              <View style={{ flex: 1 }}>
                <Text variant="eyebrow" color="ochre">
                  {online ? 'Pendientes de enviar' : 'Sin conexion'}
                </Text>
                <Text variant="small" color="ink" style={{ marginTop: 2 }}>
                  {pendientes.length === 1
                    ? '1 dosis registrada offline.'
                    : `${pendientes.length} dosis registradas offline.`}
                  {online ? ' Toca para reintentar.' : ' Se enviaran al volver la red.'}
                </Text>
              </View>
              <Text variant="mono" color="ochre" style={{ fontSize: 16 }}>{reintentando ? '…' : '↻'}</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Tabs scrollable horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', gap: spacing.lg + spacing.sm }}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={{
                  paddingBottom: spacing.sm + 2,
                  marginBottom: -1,
                  position: 'relative',
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: spacing.xs + 2,
                }}
              >
                <Text variant="mono" color="muted" style={{ fontSize: 10 }}>{t.num}</Text>
                <Text variant="body" bold color={active ? 'ink' : 'muted'}>{t.label}</Text>
                {active ? (
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: colors.ink }} />
                ) : null}
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={{ marginTop: spacing.md }}>
          {tab === 'stats' && <StatsTab refreshKey={refreshKey} />}
          {tab === 'usuarios' && <UsuariosTab refreshKey={refreshKey} />}
          {tab === 'catalogo' && <CatalogoTab refreshKey={refreshKey} />}
          {tab === 'mensajes' && <MensajesTab />}
          {tab === 'reportes' && <ReportesTab refreshKey={refreshKey} />}
          {tab === 'aefi' && <AefiTab refreshKey={refreshKey} />}
          {tab === 'auditoria' && <AuditoriaTab refreshKey={refreshKey} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
