import { useState } from 'react'
import { View, TextInput, type TextInputProps } from 'react-native'
import { colors, spacing, radius, typography } from '@/theme'
import { Text } from './Text'

interface Props extends TextInputProps {
  label?: string
  mono?: boolean
  error?: string
}

export function Field({ label, mono, error, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <View>
      {label ? <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.xs + 2 }}>{label}</Text> : null}
      <TextInput
        {...rest}
        placeholderTextColor={colors.muted2}
        onFocus={(e) => { setFocused(true); onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); onBlur?.(e) }}
        style={[
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: error ? colors.wine : (focused ? colors.moss : colors.border),
            borderRadius: radius.sharp,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            fontSize: typography.sizes.md,
            color: colors.ink,
            fontFamily: mono ? typography.mono : typography.sans,
            letterSpacing: mono ? 1.5 : 0,
          },
          style as object,
        ]}
      />
      {error ? <Text variant="small" color="wine" style={{ marginTop: spacing.xs }}>{error}</Text> : null}
    </View>
  )
}
