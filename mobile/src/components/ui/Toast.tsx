/**
 * Toast editorial para feedback de acciones (crear, eliminar, error, etc.)
 *
 * No usa nada del sistema operativo: es un componente propio coherente
 * con la paleta editorial y con auto-dismiss + slide-up animation.
 *
 * Uso:
 *   const toast = useToast()
 *   toast.success('Usuario creado')
 *   toast.error('No se pudo guardar')
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Animated, View, Pressable, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from './Text'
import { colors, spacing } from '@/theme'

type Tipo = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tipo: Tipo
  titulo?: string
  mensaje: string
}

interface ToastContextValue {
  show: (mensaje: string, opts?: { tipo?: Tipo; titulo?: string; duracion?: number }) => void
  success: (mensaje: string, titulo?: string) => void
  error:   (mensaje: string, titulo?: string) => void
  info:    (mensaje: string, titulo?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef(0)

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setItem(null)
  }, [])

  const show = useCallback<ToastContextValue['show']>((mensaje, opts) => {
    const id = ++idRef.current
    setItem({ id, mensaje, tipo: opts?.tipo ?? 'info', titulo: opts?.titulo })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setItem((curr) => (curr && curr.id === id ? null : curr))
      timerRef.current = null
    }, opts?.duracion ?? 2800)
  }, [])

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: (msg, titulo) => show(msg, { tipo: 'success', titulo }),
    error:   (msg, titulo) => show(msg, { tipo: 'error',   titulo }),
    info:    (msg, titulo) => show(msg, { tipo: 'info',    titulo }),
  }), [show])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {item ? <ToastVisible item={item} onDismiss={dismiss} /> : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    }
  }
  return ctx
}

const ACCENT: Record<Tipo, keyof typeof colors> = {
  success: 'moss',
  error:   'wine',
  info:    'ink',
}

function ToastVisible({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const slide = useRef(new Animated.Value(80)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [item.id, slide, opacity])

  const accent = ACCENT[item.tipo]

  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
      }}
    >
      <Animated.View
        style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.lg,
          transform: [{ translateY: slide }],
          opacity,
          maxWidth: 520,
          width: '92%',
        }}
      >
        <Pressable
          onPress={onDismiss}
          accessibilityRole="alert"
          accessibilityLabel={`${item.titulo ? item.titulo + ': ' : ''}${item.mensaje}`}
          style={{
            backgroundColor: colors.paper,
            borderWidth: 1,
            borderColor: colors.ink,
            borderLeftWidth: 4,
            borderLeftColor: colors[accent],
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            {item.titulo ? <Text variant="eyebrow" color={accent}>{item.titulo}</Text> : null}
            <Text variant="small" color="ink">{item.mensaje}</Text>
          </View>
          <Text variant="mono" color="muted" style={{ fontSize: 16 }}>×</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  )
}
