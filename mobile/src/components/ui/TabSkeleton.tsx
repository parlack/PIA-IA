/**
 * Skeleton generico para estados de carga en tabs admin.
 * Renderiza N filas con anchos variados para sensacion editorial.
 */
import { View } from 'react-native'

import { Skeleton } from '@/components/ui/Skeleton'
import { spacing } from '@/theme'

type Props = {
  rows?: number
  showHeader?: boolean
}

export function TabSkeleton({ rows = 4, showHeader = true }: Props) {
  return (
    <View style={{ gap: spacing.lg, paddingTop: spacing.md }}>
      {showHeader ? (
        <View style={{ gap: spacing.sm }}>
          <Skeleton width="35%" height={11} />
          <Skeleton width="70%" height={28} />
        </View>
      ) : null}

      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i} style={{ gap: spacing.xs + 2 }}>
            <Skeleton width={i % 2 === 0 ? '60%' : '80%'} height={14} />
            <Skeleton width={i % 2 === 0 ? '40%' : '55%'} height={10} />
          </View>
        ))}
      </View>
    </View>
  )
}
