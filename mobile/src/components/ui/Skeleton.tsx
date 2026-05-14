/**
 * Skeleton con shimmer sutil, paleta cream/bone editorial.
 */
import { useEffect, useRef } from 'react'
import { Animated, View, ViewStyle } from 'react-native'

import { colors } from '@/theme'

type Props = {
  width?: number | `${number}%`
  height?: number
  style?: ViewStyle
}

export function Skeleton({ width, height = 14, style }: Props) {
  const opacity = useRef(new Animated.Value(0.45)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 800, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width: (width as any) ?? '100%', height, backgroundColor: colors.bone, opacity },
        style,
      ]}
    />
  )
}
