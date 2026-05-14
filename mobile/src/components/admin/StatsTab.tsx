import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { adminApi } from '@/api/admin'
import type { AdminStats } from '@/types/admin'
import { Text } from '@/components/ui/Text'
import { Alert } from '@/components/ui/Alert'
import { TabSkeleton } from '@/components/ui/TabSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors, spacing } from '@/theme'

const GRUPO_LABEL: Record<string, string> = {
  adulto_mayor:   'Adultos mayores',
  embarazada:     'Embarazadas',
  personal_salud: 'Personal de salud',
  cronico:        'Pacientes cronicos',
}

export function StatsTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const s = await adminApi.getStats()
        if (!cancelado) setStats(s)
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudieron cargar las estadisticas.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    })()
    return () => { cancelado = true }
  }, [refreshKey])

  if (loading) {
    return <TabSkeleton rows={5} />
  }

  if (error) {
    return <Alert tipo="error" titulo="Error" mensaje={error} />
  }

  if (!stats) {
    return <EmptyState eyebrow="Sin datos" titulo="Aun no hay estadisticas" mensaje="Cuando existan usuarios y dosis registradas, aqui veras los indicadores del sistema." />
  }

  const topMax = stats.top_vacunas[0]?.aplicaciones || 1
  const totalSexo = (stats.total_hombres || 0) + (stats.total_mujeres || 0)
  const pctH = totalSexo ? Math.round(((stats.total_hombres || 0) / totalSexo) * 100) : 0
  const pctM = totalSexo ? 100 - pctH : 0

  return (
    <View style={{ gap: spacing.xxl }}>
      {/* Numbers grandes */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.xl, columnGap: spacing.lg }}>
        <StatBig label="Usuarios" value={stats.total_usuarios} />
        <StatBig label="Dosis" value={stats.total_dosis} />
        <StatBig label="Sin leer" value={stats.mensajes_no_leidos} highlight={stats.mensajes_no_leidos > 0} />
        <StatBig label="Vacunas" value={stats.total_vacunas_catalogo} />
      </View>

      {/* Top vacunas */}
      <View>
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.md }}>
          <Text variant="h2">Vacunas mas aplicadas</Text>
        </View>
        {stats.top_vacunas?.length ? stats.top_vacunas.map((v, i) => (
          <View key={`${v.nombre}-${i}`} style={{ paddingVertical: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flex: 1, minWidth: 0 }}>
                <Text variant="mono" color="muted" style={{ fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</Text>
                <Text variant="small" bold style={{ flexShrink: 1 }} numberOfLines={1}>{v.nombre}</Text>
              </View>
              <Text variant="mono" bold>{v.aplicaciones}</Text>
            </View>
            <View style={{ marginLeft: spacing.lg + 4, height: 2, backgroundColor: colors.bone }}>
              <View
                style={{
                  height: 2,
                  width: `${(v.aplicaciones / topMax) * 100}%`,
                  backgroundColor: colors.moss,
                }}
              />
            </View>
          </View>
        )) : (
          <Text variant="small" color="muted">Sin datos.</Text>
        )}
      </View>

      {/* Demografia */}
      <View>
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.md }}>
          <Text variant="h2">Demografia</Text>
        </View>

        <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.sm }}>Grupos prioritarios</Text>
        {stats.grupos_prioritarios?.length ? stats.grupos_prioritarios.map((g) => (
          <View key={g.grupo_prioritario} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}>
            <Text variant="small">{GRUPO_LABEL[g.grupo_prioritario] || g.grupo_prioritario}</Text>
            <Text variant="mono" bold>{g.total}</Text>
          </View>
        )) : (
          <Text variant="small" color="muted">Sin grupos asignados.</Text>
        )}

        <Text variant="eyebrow" color="muted" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Sexo</Text>
        <View style={{ gap: spacing.sm }}>
          <DemoBar label={`Hombres · ${stats.total_hombres || 0}`} pct={pctH} />
          <DemoBar label={`Mujeres · ${stats.total_mujeres || 0}`} pct={pctM} />
        </View>
      </View>
    </View>
  )
}

function StatBig({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={{ minWidth: '40%', flexGrow: 1 }}>
      <Text variant="eyebrow" color="muted">{label}</Text>
      <Text
        variant="display"
        color={highlight ? 'ochre' : 'ink'}
        style={{ marginTop: spacing.xs, fontSize: 44, lineHeight: 46 }}
      >
        {value}
      </Text>
    </View>
  )
}

function DemoBar({ label, pct }: { label: string; pct: number }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text variant="small">{label}</Text>
        <Text variant="mono" color="muted" style={{ fontSize: 11 }}>{pct}%</Text>
      </View>
      <View style={{ height: 4, backgroundColor: colors.bone }}>
        <View style={{ height: 4, width: `${pct}%`, backgroundColor: colors.moss }} />
      </View>
    </View>
  )
}
