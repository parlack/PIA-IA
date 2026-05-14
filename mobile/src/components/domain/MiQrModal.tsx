/**
 * Modal del QR personal del ciudadano.
 *
 * Paridad con `QrPersonalModal.vue` del frontend web:
 * - Token persistido en BD por el backend (`?regenerar=true` para nuevo).
 * - Cache local en AsyncStorage 24h, asi el modal abre instantaneamente.
 * - Pantalla a brillo maximo mientras esta abierto (mejor lectura del QR).
 * - Boton "Guardar imagen" descarga el PNG a la galeria del telefono.
 * - Boton primario "Cerrar" claro en el footer.
 */
import { useEffect, useRef, useState } from 'react'
import { View, Image, ActivityIndicator, Platform, Pressable } from 'react-native'
import * as Brightness from 'expo-brightness'
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

import { Modal } from '@/components/ui/Modal'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

import { certificadosApi } from '@/api/certificados'
import { apiClient } from '@/api/client'
import { qrCache } from '@/hooks/useQrCache'
import { useToast } from '@/components/ui/Toast'
import { colors, spacing } from '@/theme'

interface Props {
  visible: boolean
  onClose: () => void
  curp:    string
  /** Si se provee, sustituye el titulo "Tu QR personal" (util para dependientes). */
  titulo?: string
}

const QR_SIZE = 280
const QR_DOWNLOAD_SIZE = 512

function tiempoRestante(expiraEn: number | null): string {
  if (!expiraEn) return ''
  const ms = expiraEn - Date.now()
  if (ms <= 0) return 'caducado'
  const totalMin = Math.floor(ms / 60000)
  const horas = Math.floor(totalMin / 60)
  const minutos = totalMin % 60
  return horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`
}

function buildQrUrl(token: string, size: number): string {
  const payload = `${apiClient.BASE}/verificar/${token}`
  return (
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}` +
    `&data=${encodeURIComponent(payload)}&color=0E5037&bgcolor=F5F1E8`
  )
}

export function MiQrModal({ visible, onClose, curp, titulo }: Props) {
  const toast = useToast()

  const [token, setToken] = useState<string | null>(null)
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [expiraEn, setExpiraEn] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [desdeCache, setDesdeCache] = useState(false)

  const brightnessPrevRef = useRef<number | null>(null)

  useEffect(() => {
    if (!visible) {
      setToken(null)
      setQrSrc(null)
      setExpiraEn(null)
      setErrorMsg('')
      setDesdeCache(false)
      restaurarBrillo()
      return
    }
    cargarToken()
    subirBrilloAlMaximo()
    return () => {
      restaurarBrillo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, curp])

  async function cargarToken(forzar = false) {
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
    }

    setCargando(true)
    setDesdeCache(false)
    try {
      // forzar regeneracion se logra invalidando la cache local antes de llamar.
      // (El backend reutiliza el token vigente; la invalidacion la hace `regenerar()`.)
      void forzar
      const r = await certificadosApi.obtenerTokenQr(curp)
      const url = buildQrUrl(r.token, QR_SIZE)
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
  }

  async function regenerar() {
    await qrCache.invalidar(curp)
    await cargarToken(true)
  }

  async function guardarImagen() {
    if (!token) return
    setGuardando(true)
    try {
      const url = buildQrUrl(token, QR_DOWNLOAD_SIZE)
      const fileUri = `${FileSystem.cacheDirectory}pia-qr-${curp}.png`
      const { uri } = await FileSystem.downloadAsync(url, fileUri)

      // Pedimos permisos a la galeria y guardamos
      const perm = await MediaLibrary.requestPermissionsAsync()
      if (perm.granted) {
        const asset = await MediaLibrary.createAssetAsync(uri)
        try {
          await MediaLibrary.createAlbumAsync('PIA-IA', asset, false)
        } catch {
          /* algunos dispositivos no permiten albumes: el asset ya quedo en galeria */
        }
        toast.success('QR guardado en tu galeria')
        return
      }

      // Sin permisos: compartir como fallback (asi el usuario lo guarda donde quiera)
      const puede = await Sharing.isAvailableAsync()
      if (puede) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Guardar QR' })
      } else {
        toast.error('No se pudo guardar la imagen')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar la imagen.'
      toast.error(msg)
    } finally {
      setGuardando(false)
    }
  }

  async function subirBrilloAlMaximo() {
    try {
      if (Platform.OS === 'android') {
        await Brightness.requestPermissionsAsync().catch(() => {})
      }
      const actual = await Brightness.getBrightnessAsync()
      brightnessPrevRef.current = actual
      await Brightness.setBrightnessAsync(1)
    } catch {
      /* sin acceso a brillo: no es critico */
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
      /* ignorar */
    }
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      eyebrow="PIA-IA / Verificacion"
      title={titulo || 'Tu QR personal'}
      maxWidth={420}
    >
      <Text variant="small" color="muted">
        Muestra este codigo al personal de salud para que registre tu dosis sin teclear
        tu CURP. Caduca en 24 horas.
      </Text>

      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        {cargando ? (
          <View style={{ width: QR_SIZE, height: QR_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.moss} />
            <Text variant="eyebrow" color="muted" style={{ marginTop: spacing.md }}>Generando...</Text>
          </View>
        ) : errorMsg ? (
          <Alert tipo="error" titulo="No se pudo generar" mensaje={errorMsg} />
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

      {qrSrc ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <Text variant="mono" color="muted" style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {desdeCache ? 'guardado · ' : ''}vence en {tiempoRestante(expiraEn)}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable
              onPress={guardarImagen}
              disabled={guardando}
              accessibilityRole="button"
              accessibilityLabel="Guardar imagen del QR"
              hitSlop={8}
            >
              <Text variant="mono" color="moss" style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                ↓ {guardando ? 'guardando…' : 'guardar imagen'}
              </Text>
            </Pressable>
            <Pressable
              onPress={regenerar}
              disabled={cargando}
              accessibilityRole="button"
              accessibilityLabel="Regenerar QR"
              hitSlop={8}
            >
              <Text variant="mono" color="moss" style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                ↻ regenerar
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.borderSoft,
          paddingTop: spacing.md,
          marginTop: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <Text variant="small" color="muted">CURP</Text>
        <Text variant="mono" style={{ letterSpacing: 1.2 }}>{curp}</Text>
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        {errorMsg ? <Button label="Reintentar" variant="ghost" onPress={() => cargarToken(true)} /> : null}
        <Button label="Cerrar" onPress={onClose} />
      </View>
    </Modal>
  )
}
