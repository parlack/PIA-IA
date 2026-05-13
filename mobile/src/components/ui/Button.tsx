import { Pressable, ActivityIndicator, View, type PressableProps } from 'react-native'
import { colors, spacing, radius } from '@/theme'
import { Text } from './Text'

type Variant = 'primary' | 'ghost'

interface Props extends Omit<PressableProps, 'children'> {
  label: string
  variant?: Variant
  loading?: boolean
  arrow?: boolean
}

export function Button({ label, variant = 'primary', loading, arrow, disabled, style, ...rest }: Props) {
  const isPrimary = variant === 'primary'
  const isDisabled = disabled || loading

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: isPrimary ? colors.moss : 'transparent',
          borderWidth: 1,
          borderColor: isPrimary ? colors.moss : colors.border,
          borderRadius: radius.sharp,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg + spacing.xs,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style as object,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? '#fff' : colors.ink} />
      ) : (
        <>
          <Text color={isPrimary ? 'paper' : 'ink'} variant="body" bold>{label}</Text>
          {arrow ? <View><Text color={isPrimary ? 'paper' : 'ink'} variant="mono">→</Text></View> : null}
        </>
      )}
    </Pressable>
  )
}
