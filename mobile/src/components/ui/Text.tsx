import { Text as RNText, type TextProps, type StyleProp, type TextStyle } from 'react-native'
import { colors, typography } from '@/theme'
import { resolveFontFamily } from '@/theme/typography'

type Variant = 'display' | 'displayLg' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'eyebrow' | 'mono'

interface Props extends TextProps {
  variant?: Variant
  color?: keyof typeof colors
  italic?: boolean
  bold?: boolean
  style?: StyleProp<TextStyle>
}

const VARIANT_FAMILY: Record<Variant, 'display' | 'sans' | 'mono'> = {
  display:   'display',
  displayLg: 'display',
  h1:        'display',
  h2:        'display',
  h3:        'display',
  body:      'sans',
  small:     'sans',
  eyebrow:   'mono',
  mono:      'mono',
}

export function Text({ variant = 'body', color = 'ink', italic, bold, style, children, ...rest }: Props) {
  const base = variantStyle(variant)
  const family = resolveFontFamily({
    variant: VARIANT_FAMILY[variant],
    bold,
    italic: italic && VARIANT_FAMILY[variant] === 'display',
  })
  const fakeItalic = italic && VARIANT_FAMILY[variant] !== 'display'
  return (
    <RNText
      {...rest}
      style={[
        base,
        { fontFamily: family, color: colors[color] },
        fakeItalic ? { fontStyle: 'italic' } : null,
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
      return { fontSize: typography.sizes.displayLg, lineHeight: 52, letterSpacing: typography.spacing.headline }
    case 'display':
      return { fontSize: typography.sizes.display, lineHeight: 40, letterSpacing: typography.spacing.headline }
    case 'h1':
      return { fontSize: typography.sizes.xxl, lineHeight: 32 }
    case 'h2':
      return { fontSize: typography.sizes.xl, lineHeight: 28 }
    case 'h3':
      return { fontSize: typography.sizes.lg, lineHeight: 24 }
    case 'small':
      return { fontSize: typography.sizes.xs, lineHeight: 16 }
    case 'eyebrow':
      return { fontSize: typography.sizes.xxs, letterSpacing: 1.5, textTransform: 'uppercase' }
    case 'mono':
      return { fontSize: typography.sizes.sm, letterSpacing: 0.5 }
    default:
      return { fontSize: typography.sizes.md, lineHeight: 22 }
  }
}
