import { View } from 'react-native'
import { colors, spacing } from '@/theme'
import { Text } from '@/components/ui/Text'
import { fmtFecha } from '@/utils/fecha'
import type { ResumenVacuna } from '@/types'

interface Props {
  vacuna: ResumenVacuna
  showDivider?: boolean
}

export function VacunaRow({ vacuna, showDivider }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: spacing.md + 2,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: colors.borderSoft,
        borderStyle: 'dashed',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body" bold>{vacuna.nombre}</Text>
        <Text variant="small" color="muted" style={{ marginTop: 2 }}>
          {vacuna.dosis_aplicadas}/{vacuna.dosis_total} · {fmtFecha(vacuna.ultima_fecha)}
        </Text>
      </View>
      <Text
        variant="eyebrow"
        color={vacuna.completa ? 'moss' : 'muted'}
      >
        {vacuna.completa ? '● Completa' : '○ Pendiente'}
      </Text>
    </View>
  )
}
