import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Skeleton } from '@/components/ui/Skeleton'
import { colors, spacing } from '@/theme'

export function DashboardSkeleton() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {/* Header */}
        <View style={{ gap: 10, paddingBottom: spacing.lg, borderBottomWidth: 2, borderBottomColor: colors.ink }}>
          <Skeleton width={120} height={10} />
          <Skeleton width={'90%'} height={32} />
          <Skeleton width={'70%'} height={32} />
          <Skeleton width={140} height={10} />
        </View>

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ flexBasis: '45%', gap: 6 }}>
              <Skeleton width={80} height={9} />
              <Skeleton width={60} height={36} />
              <Skeleton width={90} height={10} />
            </View>
          ))}
        </View>

        {/* Pendientes */}
        <View style={{ marginTop: spacing.xl, gap: 14 }}>
          <Skeleton width={140} height={18} />
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width={'70%'} height={14} />
                <Skeleton width={'45%'} height={10} />
              </View>
              <Skeleton width={60} height={10} />
            </View>
          ))}
        </View>

        {/* Tabla vacunas */}
        <View style={{ marginTop: spacing.xl, gap: 12 }}>
          <Skeleton width={180} height={18} />
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Skeleton width={'55%'} height={12} />
              <Skeleton width={50} height={10} />
              <Skeleton width={60} height={10} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
