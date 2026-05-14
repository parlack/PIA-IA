import { useCallback, useEffect, useState } from 'react'
import { View, Pressable } from 'react-native'
import { adminApi } from '@/api/admin'
import type { AefiReporte } from '@/types/admin'
import { Text } from '@/components/ui/Text'
import { Alert } from '@/components/ui/Alert'
import { TabSkeleton } from '@/components/ui/TabSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors, spacing } from '@/theme'

type Severidad = 'todas' | 'leve' | 'moderada' | 'severa' | 'grave'

const SEVERIDADES: { key: Severidad; label: string }[] = [
  { key: 'todas',     label: 'Todas' },
  { key: 'leve',      label: 'Leve' },
  { key: 'moderada',  label: 'Moderada' },
  { key: 'severa',    label: 'Severa' },
  { key: 'grave',     label: 'Grave' },
]

const SEV_COLOR: Record<string, keyof typeof colors> = {
  leve:     'moss',
  moderada: 'ochre',
  severa:   'wine',
  grave:    'wine',
}

export function AefiTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const [filtro, setFiltro] = useState<Severidad>('todas')
  const [items, setItems] = useState<AefiReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await adminApi.listarAefi({
        severidad: filtro === 'todas' ? undefined : filtro,
        limit: 200,
      })
      setItems(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los reportes.')
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => {
    if (refreshKey > 0) cargar()
  }, [refreshKey, cargar])

  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.xs }}>Severidad</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {SEVERIDADES.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setFiltro(s.key)}
              style={{
                paddingHorizontal: spacing.sm + 2,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: filtro === s.key ? colors.ink : colors.border,
                backgroundColor: filtro === s.key ? colors.ink : 'transparent',
              }}
            >
              <Text variant="small" color={filtro === s.key ? 'paper' : 'muted'} style={{ fontSize: 11 }}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error ? <Alert tipo="error" mensaje={error} /> : null}

      {loading ? (
        <TabSkeleton rows={4} showHeader={false} />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow={filtro === 'todas' ? 'Sin eventos' : 'Sin coincidencias'}
          titulo={filtro === 'todas' ? 'No hay reportes AEFI' : 'No hay reportes en esta severidad'}
          mensaje={
            filtro === 'todas'
              ? 'Cuando los ciudadanos reporten eventos adversos despues de una vacuna, apareceran aqui.'
              : 'Prueba con otra severidad para revisar reportes en otra categoria.'
          }
          actionLabel={filtro !== 'todas' ? 'Ver todas' : undefined}
          onAction={filtro !== 'todas' ? () => setFiltro('todas') : undefined}
        />
      ) : (
        <View>
          <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, paddingVertical: spacing.sm }}>
            <Text variant="eyebrow" color="muted">{items.length} reportes</Text>
          </View>

          {items.map((r) => (
            <View key={r.id} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="body" bold numberOfLines={1}>{r.vacuna_nombre || `Dosis #${r.dosis_id}`}</Text>
                  {r.nombre_usuario ? <Text variant="small" color="muted" numberOfLines={1}>{r.nombre_usuario}</Text> : null}
                  {r.curp_usuario ? <Text variant="mono" color="muted" style={{ fontSize: 11, marginTop: 2 }}>{r.curp_usuario}</Text> : null}
                </View>
                <Text variant="eyebrow" color={SEV_COLOR[r.severidad] || 'muted'} style={{ fontSize: 10 }}>{r.severidad}</Text>
              </View>
              <Text variant="small" style={{ marginTop: spacing.xs }} numberOfLines={3}>{r.sintomas}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }}>
                {r.inicio_minutos != null ? (
                  <Text variant="small" color="muted">Inicio: {r.inicio_minutos} min</Text>
                ) : null}
                {r.requiere_seguimiento ? (
                  <Text variant="small" color="ochre">Requiere seguimiento</Text>
                ) : null}
                <Text variant="mono" color="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{r.creado_en}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
