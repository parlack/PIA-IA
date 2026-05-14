/**
 * Tab Mi QR: muestra el QR personal del ciudadano en grande.
 *
 * Comportamiento:
 *   - Al entrar al tab, lee la cache local primero (AsyncStorage).
 *   - Si hay token vigente, lo muestra al instante SIN llamar al backend.
 *   - Solo pega al endpoint cuando no hay cache valida o el usuario regenera.
 *   - Muestra el tiempo restante hasta que el token caduque.
 *   - Mientras esta visible, sube el brillo al maximo y lo restaura al salir.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Image, ActivityIndicator, Platform, ScrollView, Pressable } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Brightness from 'expo-brightness'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Drawer } from '@/components/ui/Drawer'
import { useFloatingTabBarHeight } from '@/components/navigation/FloatingTabBar'

import { certificadosApi } from '@/api/certificados'
import { apiClient } from '@/api/client'
import { sessionStore } from '@/hooks/useSession'
import { qrCache } from '@/hooks/useQrCache'
import { colors, spacing } from '@/theme'

const QR_SIZE = 280

function buildQrUrl(token: string): string {
  const payload = `${apiClient.BASE}/verificar/${token}`
  return (
    `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}` +
    `&data=${encodeURIComponent(payload)}&color=0E5037&bgcolor=F5F1E8`
  )
}

function formatearRestante(expiraEn: number | null, ahora: number): string {
  if (!expiraEn) return ''
  const ms = expiraEn - ahora
  if (ms <= 0) return 'caducado'
  const totalMin = Math.floor(ms / 60000)
  const horas = Math.floor(totalMin / 60)
  const minutos = totalMin % 60
  if (horas > 0) return `${horas}h ${minutos}m`
  if (totalMin > 0) return `${minutos}m`
  return 'menos de 1m'
}

export default function QrTab() {
  const tabBarH = useFloatingTabBarHeight()
  const [curp, setCurp] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [expiraEn, setExpiraEn] = useState<number | null>(null)
  const [desdeCache, setDesdeCache] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [ahora, setAhora] = useState(Date.now())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const brightnessPrevRef = useRef<number | null>(null)

  useEffect(() => {
    (async () => {
      const c = await sessionStore.getCurp()
      setCurp(c)
    })()
  }, [])

  // Reloj para refrescar el "vence en ..." cada minuto sin re-renderizar de mas.
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  /**
   * forzar=true: invalida la cache y pide un token NUEVO al backend.
   * forzar=false (default): lee la cache; si no hay, pide al backend pero
   *   el backend reutiliza el token vigente si existe.
   */
  const cargarToken = useCallback(async (forzar = false) => {
    if (!curp) return
    setErrorMsg('')

    if (!forzar) {
      const cached = await qrCache.leer(curp)
      if (cached) {
        setToken(cached.token)
        setQrSrc(cached.qrSrc)
        setExpiraEn(cached.expiraEn)
        setDesdeCache(true)
        return
      }
    } else {
      await qrCache.invalidar(curp)
    }

    setCargando(true)
    setDesdeCache(false)
    try {
      const r = await certificadosApi.obtenerTokenQr(curp)
      const url = buildQrUrl(r.token)
      // El backend devuelve `expira_en_iso` con la fecha real de expiracion.
      const exp = r.expira_en_iso ? new Date(r.expira_en_iso).getTime() : undefined
      const entry = await qrCache.guardar(curp, r.token, url, exp)
      setToken(r.token)
      setQrSrc(url)
      setExpiraEn(entry.expiraEn)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo generar el QR.'
      setErrorMsg(msg)
    } finally {
      setCargando(false)
    }
  }, [curp])

  // Cuando el tab obtiene/pierde foco, ajustamos brillo y cargamos (cache-first).
  useFocusEffect(
    useCallback(() => {
      let active = true
      ;(async () => {
        await subirBrillo()
        if (active && curp) await cargarToken(false)
      })()
      return () => {
        active = false
        restaurarBrillo()
      }
    }, [curp, cargarToken]),
  )

  async function subirBrillo() {
    try {
      if (Platform.OS === 'android') {
        await Brightness.requestPermissionsAsync()
      }
      const actual = await Brightness.getBrightnessAsync()
      if (brightnessPrevRef.current == null) {
        brightnessPrevRef.current = actual
      }
      await Brightness.setBrightnessAsync(1)
    } catch {
      // sin acceso a brillo: no es critico
    }
  }

  async function restaurarBrillo() {
    try {
      if (brightnessPrevRef.current != null) {
        await Brightness.setBrightnessAsync(brightnessPrevRef.current)
        brightnessPrevRef.current = null
      } else {
        await Brightness.useSystemBrightnessAsync()
      }
    } catch {
      // ignorar
    }
  }

  const restante = formatearRestante(expiraEn, ahora)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => setDrawerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Text variant="h2" style={{ fontSize: 22 }}>≡</Text>
          <Text variant="mono" style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' }}>
            Menu
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingTop: 0, paddingBottom: tabBarH + spacing.lg, gap: spacing.lg }}
      >
        <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, paddingBottom: spacing.lg }}>
          <Text variant="eyebrow" color="muted">PIA-IA / Verificacion</Text>
          <Text variant="display" style={{ marginTop: spacing.sm }}>
            Tu QR{'\n'}<Text variant="display" italic>personal.</Text>
          </Text>
          <Text variant="small" color="muted" style={{ marginTop: spacing.md }}>
            Muestra este codigo al personal de salud para que registre tu dosis sin teclear tu CURP. Caduca en 24 horas.
          </Text>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          {cargando ? (
            <View style={{ width: QR_SIZE, height: QR_SIZE, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.moss} />
              <Text variant="eyebrow" color="muted" style={{ marginTop: spacing.md }}>Generando...</Text>
            </View>
          ) : errorMsg ? (
            <View style={{ width: '100%' }}>
              <Alert tipo="error" titulo="No se pudo generar" mensaje={errorMsg} />
            </View>
          ) : qrSrc ? (
            <View
              style={{
                padding: spacing.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Image source={{ uri: qrSrc }} style={{ width: QR_SIZE, height: QR_SIZE }} resizeMode="contain" />
            </View>
          ) : null}
        </View>

        {qrSrc && restante ? (
          <Text
            variant="mono"
            color="muted"
            style={{ textAlign: 'center', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            {desdeCache ? 'guardado · ' : ''}vence en {restante}
          </Text>
        ) : null}

        {curp ? (
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Text variant="eyebrow" color="muted">CURP</Text>
            <Text variant="mono" style={{ letterSpacing: 1.4 }}>{curp}</Text>
          </View>
        ) : null}

        {token ? (
          <Pressable onPress={() => cargarToken(true)}>
            <Text variant="mono" color="muted" style={{ textAlign: 'center', fontSize: 10 }} numberOfLines={2}>
              {token}
            </Text>
            <Text variant="eyebrow" color="muted" style={{ textAlign: 'center', marginTop: spacing.xs }}>
              TOCAR PARA REGENERAR
            </Text>
          </Pressable>
        ) : null}

        <Button label="Regenerar QR" variant="ghost" onPress={() => cargarToken(true)} />
      </ScrollView>

      <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  )
}
