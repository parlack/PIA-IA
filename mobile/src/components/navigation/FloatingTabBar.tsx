/**
 * TabBar flotante editorial PIA-IA.
 *
 * Inspirado en el patron iOS pill: barra flotante con respeto al safe-area,
 * pill animada con spring + haptic feedback sutil al cambiar de pestana.
 * La paleta es la del sistema PIA-IA (moss / paper / ink).
 */
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

import { Text } from '@/components/ui/Text'
import { colors } from '@/theme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  inicio:  { active: 'home',           inactive: 'home-outline' },
  vacunas: { active: 'medkit',         inactive: 'medkit-outline' },
  qr:      { active: 'qr-code',        inactive: 'qr-code-outline' },
  perfil:  { active: 'person-circle',  inactive: 'person-circle-outline' },
}

const LABELS: Record<string, string> = {
  inicio:  'Inicio',
  vacunas: 'Vacunas',
  qr:      'Mi QR',
  perfil:  'Perfil',
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const bottomOffset = Math.max(insets.bottom, 12) + 6

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View
        style={[
          styles.floating,
          {
            bottom: bottomOffset,
            backgroundColor: colors.paper,
            borderColor: colors.ink,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const iconSet = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' }
          const label = LABELS[route.name] ?? route.name

          const onPress = () => {
            Haptics.selectionAsync().catch(() => {})
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          return (
            <TabButton
              key={route.key}
              focused={focused}
              onPress={onPress}
              iconName={focused ? iconSet.active : iconSet.inactive}
              label={label}
            />
          )
        })}
      </View>
    </View>
  )
}

function TabButton({
  focused,
  onPress,
  iconName,
  label,
}: {
  focused: boolean
  onPress: () => void
  iconName: IoniconName
  label: string
}) {
  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: focused ? colors.mossSoft : 'transparent',
    transform: [{ scale: withSpring(focused ? 1 : 0.96, { damping: 16, stiffness: 260 }) }],
  }))

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(focused ? -1 : 0, { duration: 180 }) }],
  }))

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.pill, pillStyle]}>
        <Animated.View style={iconWrapStyle}>
          <Ionicons
            name={iconName}
            size={20}
            color={focused ? colors.mossDark : colors.muted}
          />
        </Animated.View>
      </Animated.View>
      <Text
        variant="eyebrow"
        color={focused ? 'mossDark' : 'muted'}
        style={{ marginTop: 2, fontSize: 9 }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  floating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 28,
    borderWidth: 1,
    width: '92%',
    maxWidth: 460,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  pill: {
    height: 36,
    minWidth: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
})

/**
 * Altura que ocupa visualmente el tab bar flotante (incluye safe-area).
 * Las pantallas internas pueden usar este valor como `paddingBottom`.
 */
export function useFloatingTabBarHeight(): number {
  const insets = useSafeAreaInsets()
  return Math.max(insets.bottom, 12) + 6 + 60
}
