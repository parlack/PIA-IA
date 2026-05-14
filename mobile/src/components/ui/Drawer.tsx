/**
 * Drawer lateral (menu) editorial.
 *
 * Equivalente al sidebar fijo de la web. En mobile usa un overlay con slide
 * lateral desde la izquierda, agrupando los items por seccion (Mi salud,
 * Servicios, Cuenta, Sistema).
 *
 * No depende de @react-navigation/drawer para no complicar el setup; usa
 * Animated + Pressable nativos.
 */
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, usePathname } from 'expo-router'

import { Text } from './Text'
import { NavIcon, type NavIconName } from './NavIcon'
import { colors, spacing } from '@/theme'
import { useDashboardData } from '@/hooks/useDashboardData'
import { sessionStore } from '@/hooks/useSession'
import { esRolAdmin } from '@/utils/rol'

interface Props {
  visible: boolean
  onClose: () => void
}

interface DrawerItem {
  to:        string
  label:     string
  icon:      NavIconName
  authOnly?: boolean
  badge?:    number
}

interface DrawerGroup {
  label: string
  items: DrawerItem[]
}

const DRAWER_WIDTH = Math.min(300, Dimensions.get('window').width * 0.82)

export function Drawer({ visible, onClose }: Props) {
  const pathname = usePathname()
  const { noLeidos, usuario } = useDashboardData()

  const [rol, setRol] = useState('')
  const [isAuthed, setAuthed] = useState(false)

  useEffect(() => {
    if (!visible) return
    sessionStore.getRol().then(setRol)
    sessionStore.isAuthenticated().then(setAuthed)
  }, [visible])

  const groups: DrawerGroup[] = (() => {
    const result: DrawerGroup[] = [
      {
        label: 'MI SALUD',
        items: [
          { to: '/inicio',     label: 'Inicio',           icon: 'summary'  },
          { to: '/vacunas',    label: 'Vacunas',          icon: 'vaccines' },
          { to: '/alergias',   label: 'Alergias',         icon: 'allergies' },
          { to: '/aefi',       label: 'Eventos adversos', icon: 'aefi' },
        ],
      },
      {
        label: 'SERVICIOS',
        items: [
          { to: '/mensajes',      label: 'Buzon',       icon: 'inbox',        badge: noLeidos },
          { to: '/unidad-medica', label: 'Mi unidad',   icon: 'medical-unit' },
          { to: '/qr',            label: 'Mi QR',       icon: 'qr' },
        ],
      },
      {
        label: 'CUENTA',
        items: [
          { to: '/perfil', label: 'Mi perfil', icon: 'profile' },
        ],
      },
    ]
    if (isAuthed) {
      result[1]!.items.splice(1, 0, {
        to: '/dependientes', label: 'Dependientes', icon: 'dependents', authOnly: true,
      })
    }
    if (esRolAdmin(rol)) {
      result.push({
        label: 'SISTEMA',
        items: [{ to: '/admin', label: 'Administracion', icon: 'admin' }],
      })
    }
    return result
  })()

  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current
  const overlay = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slide,   { toValue: 0,    duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlay, { toValue: 0.55, duration: 220, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slide,   { toValue: -DRAWER_WIDTH, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlay, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, slide, overlay])

  function navegar(to: string) {
    onClose()
    if (pathname !== to) {
      router.push(to as any)
    }
  }

  async function logout() {
    onClose()
    await sessionStore.logout()
    router.replace('/login')
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Animated.View
          style={{
            ...StyleSheetAbsoluteFill,
            backgroundColor: '#1C1B17',
            opacity: overlay,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar menu" />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: DRAWER_WIDTH,
            backgroundColor: colors.mossDark,
            transform: [{ translateX: slide }],
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 14,
          }}
        >
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            {/* Brand */}
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
              <Text variant="display" color="paper" style={{ fontSize: 22 }}>PIA-IA</Text>
              <Text variant="mono" color="paper" style={{ fontSize: 9, letterSpacing: 1.8, opacity: 0.55, marginTop: 4 }}>
                CARTILLA DIGITAL
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(245,241,232,0.1)', marginHorizontal: spacing.xl }} />

            {/* Nav */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.xl }}>
              {groups.map((group, gi) => (
                <View key={group.label} style={{ marginTop: gi === 0 ? 0 : spacing.lg }}>
                  <Text
                    variant="mono"
                    color="paper"
                    style={{ fontSize: 9, letterSpacing: 1.8, opacity: 0.45, marginBottom: spacing.sm }}
                  >
                    {group.label}
                  </Text>

                  {group.items.map(item => {
                    const isActive = pathname === item.to
                    const opacity = isActive ? 1 : 0.6
                    return (
                      <Pressable
                        key={item.to}
                        onPress={() => navegar(item.to)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 10,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <View style={{ opacity }}>
                            <NavIcon name={item.icon} size={18} color={colors.paper} />
                          </View>
                          <Text
                            variant="body"
                            color="paper"
                            style={{ opacity, fontSize: 15 }}
                          >
                            {item.label}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {item.badge ? (
                            <View style={{ backgroundColor: colors.moss, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text variant="mono" color="paper" style={{ fontSize: 10, letterSpacing: 0.5 }}>
                                {item.badge}
                              </Text>
                            </View>
                          ) : null}
                          {isActive ? (
                            <Text variant="mono" color="paper" style={{ fontSize: 12 }}>→</Text>
                          ) : null}
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              ))}
            </ScrollView>

            {/* Footer usuario */}
            <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(245,241,232,0.1)' }}>
              <Text variant="body" color="paper" style={{ fontSize: 14, marginBottom: 2 }}>
                {usuario ? `${usuario.nombre} ${usuario.apellido_paterno}` : 'Usuario'}
              </Text>
              <Text variant="mono" color="paper" style={{ fontSize: 10, letterSpacing: 1.4, opacity: 0.6, textTransform: 'uppercase' }}>
                {esRolAdmin(rol) ? 'Administrador' : 'Asegurado'}
              </Text>
              <Pressable
                onPress={logout}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesion"
                style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                hitSlop={8}
              >
                <NavIcon name="logout" size={14} color={colors.paper} />
                <Text variant="mono" color="paper" style={{ fontSize: 10, letterSpacing: 1.4, opacity: 0.7 }}>
                  CERRAR SESION
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
}
