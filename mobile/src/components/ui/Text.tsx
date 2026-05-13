import { Text as RNText, type TextProps, type StyleProp, type TextStyle } from 'react-native'
import { colors, typography } from '@/theme'

type Variant = 'display' | 'displayLg' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'eyebrow' | 'mono'

interface Props extends TextProps {
  variant?: Variant
  color?: keyof typeof colors
  italic?: boolean
  bold?: boolean
  style?: StyleProp<TextStyle>
}

export function Text({ variant = 'body', color = 'ink', italic, bold, style, children, ...rest }: Props) {
  const base = variantStyle(variant)
  return (
    <RNText
      {...rest}
      style={[
        base,
        { color: colors[color] },
        italic ? { fontStyle: 'italic' } : null,
        bold ? { fontWeight: '600' } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  )
}

function variantStyle(v: Variant): TextStyle {
  switch (v) {
    case 'displayLg':
      return { fontFamily: typography.display, fontSize: typography.sizes.displayLg, lineHeight: 52, letterSpacing: typography.spacing.headline }
    case 'display':
      return { fontFamily: typography.display, fontSize: typography.sizes.display, lineHeight: 40, letterSpacing: typography.spacing.headline }
    case 'h1':
      return { fontFamily: typography.display, fontSize: typography.sizes.xxl, lineHeight: 32 }
    case 'h2':
      return { fontFamily: typography.display, fontSize: typography.sizes.xl, lineHeight: 28 }
    case 'h3':
      return { fontFamily: typography.display, fontSize: typography.sizes.lg, lineHeight: 24 }
    case 'small':
      return { fontFamily: typography.sans, fontSize: typography.sizes.xs, lineHeight: 16 }
    case 'eyebrow':
      return { fontFamily: typography.mono, fontSize: typography.sizes.xxs, letterSpacing: 1.5, textTransform: 'uppercase' }
    case 'mono':
      return { fontFamily: typography.mono, fontSize: typography.sizes.sm, letterSpacing: 0.5 }
    default:
      return { fontFamily: typography.sans, fontSize: typography.sizes.md, lineHeight: 22 }
  }
}
