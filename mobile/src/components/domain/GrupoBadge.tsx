import { View } from 'react-native'
import { colors, spacing, typography } from '@/theme'
import { Text } from '@/components/ui/Text'
import { etiquetaGrupo } from '@/constants/grupos'
import type { GrupoPrioritario } from '@/types'

interface Props {
  grupo: GrupoPrioritario | string | null | undefined
}

export function GrupoBadge({ grupo }: Props) {
  if (!grupo || grupo === 'ninguno') return null
  return (
    <View
      style={{
        backgroundColor: colors.mossSoft,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontFamily: typography.mono,
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.mossDark,
        }}
      >
        {etiquetaGrupo(grupo)}
      </Text>
    </View>
  )
}
