import { Pressable, View } from 'react-native'
import { colors, spacing } from '@/theme'
import { Text } from './Text'

interface TabsProps<T extends string> {
  value: T
  options: { key: T; label: string }[]
  onChange: (v: T) => void
}

export function Tabs<T extends string>({ value, options, onChange }: TabsProps<T>) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.lg + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {options.map((opt) => {
        const active = value === opt.key
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="tab"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={{ paddingBottom: spacing.sm + 2, marginBottom: -1, position: 'relative' }}
          >
            <Text variant="body" bold color={active ? 'ink' : 'muted'}>{opt.label}</Text>
            {active ? (
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: colors.ink }} />
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}
