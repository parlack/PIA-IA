import { View } from 'react-native'
import { colors, spacing } from '@/theme'
import { Text } from '@/components/ui/Text'
import type { Alerta } from '@/types'

interface Props {
  alertas: Alerta[]
}

export function AlertaBanner({ alertas }: Props) {
  if (!alertas.length) return null

  return (
    <View
      style={{
        backgroundColor: 'rgba(180,83,9,0.06)',
        borderLeftWidth: 4,
        borderLeftColor: colors.ochre,
        padding: spacing.lg,
        marginBottom: spacing.xl,
      }}
    >
      <Text variant="eyebrow" color="ochre">Atencion prioritaria</Text>
      <Text variant="h3" bold style={{ marginTop: spacing.sm }}>
        {alertas.length} {alertas.length === 1 ? 'vacuna requiere' : 'vacunas requieren'} tu atencion
      </Text>
      <View style={{ marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {alertas.map((a) => (
          <View key={a.vacuna_id} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'baseline' }}>
            <Text variant="mono" color="ochre" style={{ fontSize: 10 }}>●</Text>
            <Text variant="small" bold>{a.nombre}</Text>
            <Text variant="mono" color="muted" style={{ fontSize: 11 }}>({a.dosis_faltantes})</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
