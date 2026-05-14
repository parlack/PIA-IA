import { useRef, useState } from 'react'
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VideoView, useVideoPlayer } from 'expo-video'

import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'

import { useAuth } from '@/hooks/useAuth'
import { normalizarCurp } from '@/utils/curp'
import { esRolAdmin, esRolPrivilegiado, rutaPorRol } from '@/utils/rol'
import { colors, spacing } from '@/theme'

type Tab = 'consulta' | 'acceso'

const VIDEO_SOURCE = require('../assets/login-hero.webm')
const LOGO_SOURCE = require('../assets/pia-logo.png')

export default function LoginScreen() {
  const { height: viewportHeight } = useWindowDimensions()
  const scrollRef = useRef<ScrollView | null>(null)
  const cardYRef = useRef(0)
  const [tab, setTab] = useState<Tab>('consulta')
  const [curp, setCurp] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuth()

  const [adminWarning, setAdminWarning] = useState('')

  function scrollToCard() {
    // Cuando un input recibe foco, deslizamos la card por encima del teclado.
    // Margen de 24px para que el label del eyebrow quede visible.
    scrollRef.current?.scrollTo({
      y: Math.max(0, cardYRef.current - 24),
      animated: true,
    })
  }

  const player = useVideoPlayer(VIDEO_SOURCE, (instance) => {
    instance.loop = true
    instance.muted = true
    instance.play()
  })

  async function handleSubmit() {
    setAdminWarning('')
    const res = await login(curp, tab === 'acceso' ? password : undefined)
    if (res.estado === 'error') return
    if (esRolPrivilegiado(res.rol) && res.estado !== 'autenticado') {
      setAdminWarning(
        esRolAdmin(res.rol)
          ? 'Las cuentas administrativas requieren acceso completo con contrasena.'
          : 'Las cuentas medicas requieren acceso completo con contrasena.',
      )
      setTab('acceso')
      return
    }
    router.replace(rutaPorRol(res.rol))
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.mossDark }}>
      {/* Video de fondo difuminado a pantalla completa */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
        {/* Veil oscuro + tinte moss */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(8,46,32,0.62)' },
          ]}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xxxl,
              minHeight: viewportHeight - 40,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header logo + identidad */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <Image
                source={LOGO_SOURCE}
                style={{
                  width: 44,
                  height: 44,
                  tintColor: '#FFFFFF',
                  resizeMode: 'contain',
                }}
              />
              <View>
                <Text variant="eyebrow" color="paper" style={{ opacity: 0.72 }}>
                  PIA · IA
                </Text>
                <Text
                  variant="eyebrow"
                  color="paper"
                  style={{ opacity: 0.72, marginTop: 2 }}
                >
                  SECRETARIA DE SALUD
                </Text>
              </View>
            </View>

            {/* Hero editorial */}
            <View style={{ marginTop: spacing.xxl + spacing.md }}>
              <Text variant="eyebrow" style={{ color: colors.mossSoft }}>
                Sistema Nacional de Inmunizacion
              </Text>
              <Text
                variant="display"
                color="paper"
                style={{
                  marginTop: spacing.md,
                  fontSize: 38,
                  lineHeight: 42,
                  letterSpacing: -0.5,
                }}
              >
                Tu cartilla{'\n'}
                <Text
                  variant="display"
                  color="paper"
                  italic
                  style={{ fontSize: 38, lineHeight: 42 }}
                >
                  de vacunacion,
                </Text>
                {'\n'}siempre contigo.
              </Text>
              <Text
                variant="small"
                color="paper"
                style={{
                  marginTop: spacing.md,
                  opacity: 0.8,
                  lineHeight: 20,
                  maxWidth: 420,
                }}
              >
                Consulta tu historial, registra dosis y recibe alertas oficiales
                en un solo lugar.
              </Text>
            </View>

            {/* Card translucida para el form */}
            <View
              style={styles.card}
              onLayout={(e) => {
                cardYRef.current = e.nativeEvent.layout.y
              }}
            >
              <Text variant="eyebrow" color="muted">
                Acceso ciudadano
              </Text>
              <Text variant="h1" style={{ marginTop: spacing.sm }}>
                Identificate
              </Text>
              <Text
                variant="small"
                color="muted"
                style={{ marginTop: spacing.xs }}
              >
                Selecciona como deseas continuar.
              </Text>

              <View style={{ marginTop: spacing.lg }}>
                <Tabs<Tab>
                  value={tab}
                  onChange={(v) => {
                    setTab(v)
                    setPassword('')
                  }}
                  options={[
                    { key: 'consulta', label: 'Consulta rapida' },
                    { key: 'acceso', label: 'Acceso completo' },
                  ]}
                />
              </View>

              <Text
                variant="small"
                color="muted"
                style={{ marginTop: spacing.md, lineHeight: 19 }}
              >
                {tab === 'consulta'
                  ? 'Solo necesitas tu CURP. Ideal para consultar tu historial sin recordar contrasenas.'
                  : 'Ingresa con CURP y contrasena para gestionar tu expediente completo.'}
              </Text>

              <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
                <Field
                  label="CURP"
                  value={curp}
                  onChangeText={(t) => setCurp(normalizarCurp(t))}
                  placeholder="XXXX000000XXXXXXXX"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={18}
                  mono
                  onFocus={scrollToCard}
                />

                {tab === 'acceso' ? (
                  <Field
                    label="Contrasena"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                    onFocus={scrollToCard}
                  />
                ) : null}

                {error ? (
                  <View
                    style={{
                      borderLeftWidth: 2,
                      borderLeftColor: colors.wine,
                      paddingLeft: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: 'rgba(153,27,27,0.04)',
                    }}
                  >
                    <Text variant="small" color="wine">
                      {error}
                    </Text>
                  </View>
                ) : null}

                {adminWarning ? (
                  <View
                    style={{
                      borderLeftWidth: 2,
                      borderLeftColor: colors.ochre,
                      paddingLeft: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: 'rgba(180,83,9,0.06)',
                    }}
                  >
                    <Text variant="small" color="ochre">
                      {adminWarning}
                    </Text>
                  </View>
                ) : null}

                <Button
                  label={
                    loading
                      ? 'Verificando…'
                      : tab === 'consulta'
                        ? 'Ver mi cartilla'
                        : 'Iniciar sesion'
                  }
                  loading={loading}
                  arrow={!loading}
                  onPress={handleSubmit}
                />
              </View>

              <View
                style={{
                  marginTop: spacing.xl,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Pressable
                  onPress={() => {}}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="No conozco mi CURP"
                >
                  <Text variant="eyebrow" color="muted">
                    No conozco mi CURP →
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text
              variant="mono"
              color="paper"
              style={{
                marginTop: spacing.xl,
                opacity: 0.5,
                fontSize: 10,
                textAlign: 'center',
                letterSpacing: 1.2,
              }}
            >
              © {new Date().getFullYear()} — PIA-IA · MX
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xxl + spacing.md,
    backgroundColor: 'rgba(244, 239, 231, 0.95)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 36,
    elevation: 12,
  },
})
