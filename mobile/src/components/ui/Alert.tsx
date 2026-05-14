import { View } from 'react-native'
import { colors, spacing } from '@/theme'
import { Text } from './Text'

type Tipo = 'info' | 'exito' | 'advertencia' | 'error'

const COLOR: Record<Tipo, keyof typeof colors> = {
  info:         'moss',
  exito:        'moss',
  advertencia:  'ochre',
  error:        'wine',
}

interface AlertProps {
  tipo?: Tipo
  titulo?: string
  mensaje: string
}

export function Alert({ tipo = 'info', titulo, mensaje }: AlertProps) {
  const color = COLOR[tipo]
  return (
    <View
      style={{
        borderLeftWidth: 2,
        borderLeftColor: colors[color],
        backgroundColor: 'rgba(28,27,23,0.03)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
      }}
    >
      {titulo ? <Text variant="eyebrow" color={color} style={{ marginBottom: 2 }}>{titulo}</Text> : null}
      <Text variant="small" color={color === 'ink' ? 'ink' : color}>{mensaje}</Text>
    </View>
  )
}
