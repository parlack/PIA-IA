/**
 * 4 numeros grandes editoriales: completas, pendientes, esquema, bandeja.
 */
import { View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { colors, spacing } from '@/theme'

interface Props {
  completadas:   number
  totalVacunas:  number
  pendientes:    number
  porcentaje:    number
  noLeidos:      number
}

export function StatsGrid({ completadas, totalVacunas, pendientes, porcentaje, noLeidos }: Props) {
  const colorBarra =
    porcentaje === 100 ? colors.moss :
    porcentaje >= 60   ? colors.ochre :
                         colors.wine

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: spacing.lg,
        rowGap: spacing.xl,
        marginBottom: spacing.xxl,
      }}
    >
      <View style={{ flexBasis: '47%', flexGrow: 1 }}>
        <Text variant="eyebrow" color="muted">Completas</Text>
        <Text variant="display" style={{ marginTop: spacing.xs }}>{completadas}</Text>
        <Text variant="small" color="muted">de {totalVacunas} en catalogo</Text>
      </View>

      <View style={{ flexBasis: '47%', flexGrow: 1 }}>
        <Text variant="eyebrow" color="muted">Pendientes</Text>
        <Text
          variant="display"
          color={pendientes > 0 ? 'wine' : 'ink'}
          style={{ marginTop: spacing.xs }}
        >
          {pendientes}
        </Text>
        <Text variant="small" color="muted">requieren accion</Text>
      </View>

      <View style={{ flexBasis: '47%', flexGrow: 1 }}>
        <Text variant="eyebrow" color="muted">Esquema</Text>
        <Text variant="display" style={{ marginTop: spacing.xs }}>
          {porcentaje}<Text variant="h2" color="muted">%</Text>
        </Text>
        <View style={{ height: 3, backgroundColor: colors.bone, marginTop: spacing.sm }}>
          <View style={{ height: 3, backgroundColor: colorBarra, width: `${porcentaje}%` }} />
        </View>
        <Text variant="small" color="muted" style={{ marginTop: spacing.xs }}>
          {completadas}/{totalVacunas} vacunas
        </Text>
      </View>

      <View style={{ flexBasis: '47%', flexGrow: 1 }}>
        <Text variant="eyebrow" color="muted">Bandeja</Text>
        <Text variant="display" style={{ marginTop: spacing.xs }}>{noLeidos}</Text>
        <Text variant="small" color="muted">
          {noLeidos === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
        </Text>
      </View>
    </View>
  )
}
