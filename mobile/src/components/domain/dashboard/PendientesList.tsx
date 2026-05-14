/**
 * Lista numerada de vacunas pendientes.
 */
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'

import { Text } from '@/components/ui/Text'
import { colors, spacing } from '@/theme'
import type { ResumenVacuna } from '@/types'

interface Props {
  pendientes:   ResumenVacuna[]
  limit?:       number
  showVerTodo?: boolean
}

export function PendientesList({ pendientes, limit, showVerTodo }: Props) {
  if (!pendientes.length) return null

  const items = limit ? pendientes.slice(0, limit) : pendientes
  const hayMas = Boolean(limit) && pendientes.length > (limit ?? 0)

  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottomWidth: 1,
          borderBottomColor: colors.ink,
          paddingBottom: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <Text variant="h2">Pendientes</Text>
        <Text variant="eyebrow" color="muted">
          {pendientes.length} {pendientes.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View>
        {items.map((v, idx) => (
          <View
            key={v.vacuna_id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingVertical: spacing.md,
              borderBottomWidth: idx < items.length - 1 ? 1 : 0,
              borderBottomColor: colors.borderSoft,
              borderStyle: 'dashed',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md, flex: 1 }}>
              <Text variant="mono" style={{ fontSize: 11, opacity: 0.5, letterSpacing: 0.8 }}>
                {String(idx + 1).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1 }}>
                <Text variant="body" bold>{v.nombre}</Text>
                <Text variant="small" color="muted" style={{ marginTop: 2 }}>
                  {v.dosis_aplicadas} de {v.dosis_total} aplicadas
                </Text>
              </View>
            </View>
            <Text
              variant="eyebrow"
              color={v.dosis_aplicadas === 0 ? 'wine' : 'ochre'}
            >
              {v.dosis_aplicadas === 0 ? 'Sin aplicar' : 'Incompleta'}
            </Text>
          </View>
        ))}
      </View>

      {showVerTodo && hayMas ? (
        <Pressable
          onPress={() => router.push('/vacunas')}
          hitSlop={8}
          style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text variant="eyebrow">Ver todas ({pendientes.length})</Text>
          <Text variant="mono">→</Text>
        </Pressable>
      ) : null}
    </View>
  )
}
