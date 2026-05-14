/**
 * EmptyState editorial: bloque centrado con eyebrow + mensaje + accion opcional.
 * Mantiene consistencia visual en todos los tabs admin.
 */
import { View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { colors, spacing } from '@/theme'

type Props = {
  eyebrow?: string
  titulo?: string
  mensaje: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ eyebrow, titulo, mensaje, actionLabel, onAction }: Props) {
  return (
    <View
      style={{
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        backgroundColor: colors.surface,
        gap: spacing.sm,
      }}
    >
      {eyebrow ? (
        <Text variant="eyebrow" color="muted">{eyebrow}</Text>
      ) : null}
      {titulo ? (
        <Text variant="h2">{titulo}</Text>
      ) : null}
      <Text variant="small" color="muted">{mensaje}</Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}>
          <Button label={actionLabel} variant="ghost" onPress={onAction} arrow />
        </View>
      ) : null}
    </View>
  )
}
