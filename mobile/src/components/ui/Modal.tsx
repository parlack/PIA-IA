import { Modal as RNModal, Pressable, View, ScrollView } from 'react-native'
import { colors, spacing } from '@/theme'
import { Text } from './Text'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  eyebrow?: string
  children: React.ReactNode
  maxWidth?: number
}

export function Modal({ visible, onClose, title, eyebrow, children, maxWidth = 520 }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(28,27,23,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth,
            maxHeight: '90%',
            backgroundColor: colors.paper,
            borderWidth: 1,
            borderColor: colors.ink,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.xl,
              paddingBottom: spacing.md,
              borderBottomWidth: 2,
              borderBottomColor: colors.ink,
            }}
          >
            <View style={{ flex: 1 }}>
              {eyebrow ? <Text variant="eyebrow" color="muted">{eyebrow}</Text> : null}
              {title ? <Text variant="h2" style={{ marginTop: eyebrow ? spacing.xs : 0 }}>{title}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text variant="mono" style={{ fontSize: 18 }}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  )
}
