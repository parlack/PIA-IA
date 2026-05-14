/**
 * Pantalla del admin: escanea el QR personal de un ciudadano y registra
 * la dosis aplicada usando POST /certificados/aplicar-por-token.
 *
 * Flujo:
 *   1. Pide permiso de camara.
 *   2. Muestra el viewfinder y detecta codigo QR.
 *   3. Verifica el token contra el backend para mostrar al paciente.
 *   4. Abre form de registro de dosis (vacuna del catalogo, num dosis, fecha, etc.).
 *   5. Registra la dosis y muestra confirmacion.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import * as Haptics from 'expo-haptics'

import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useToast } from '@/components/ui/Toast'

import { sessionStore } from '@/hooks/useSession'
import { adminApi } from '@/api/admin'
import {
  certificadosApi,
  type UsuarioVerificado,
  type ResumenVacuna,
} from '@/api/certificados'
import type { ApiError } from '@/api/client'
import type { CatalogoVacunaRow } from '@/types/admin'
import { offlineQueue } from '@/utils/offlineQueue'
import { colors, spacing } from '@/theme'

type Etapa = 'escaneando' | 'verificando' | 'listo' | 'registrando' | 'exito'

interface CatalogoOpcion {
  id: number
  nombre: string
  enfermedad: string
  dosis_total: number
}

export default function AplicarQrScreen() {
  const toast = useToast()
  const [permission, requestPermission] = useCameraPermissions()

  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [actorCurp, setActorCurp] = useState<string>('')

  const [etapa, setEtapa] = useState<Etapa>('escaneando')
  const [tokenLeido, setTokenLeido] = useState<string | null>(null)
  const [paciente, setPaciente] = useState<UsuarioVerificado | null>(null)
  const [resumen, setResumen] = useState<ResumenVacuna[]>([])
  const [errorScan, setErrorScan] = useState('')
  const lockRef = useRef(false)

  const [catalogo, setCatalogo] = useState<CatalogoOpcion[]>([])
  const [vacunaId, setVacunaId] = useState<number | null>(null)
  const [numDosis, setNumDosis] = useState('1')
  const [fechaAplicacion, setFechaAplicacion] = useState(new Date().toISOString().slice(0, 10))
  const [lugar, setLugar] = useState('')
  const [lote, setLote] = useState('')
  const [errorRegistro, setErrorRegistro] = useState('')

  // ---- Autorizacion + carga inicial ---------------------------------------

  useEffect(() => {
    (async () => {
      const admin = await sessionStore.isAdmin()
      const auth = await sessionStore.isAuthenticated()
      if (!admin) {
        router.replace('/inicio')
        return
      }
      if (!auth) {
        router.replace('/login')
        return
      }
      const curp = await sessionStore.getCurp()
      setActorCurp(curp ?? '')
      setAuthorized(true)

      try {
        const cat = await adminApi.listarCatalogo()
        const mapped: CatalogoOpcion[] = cat.map((c: CatalogoVacunaRow) => ({
          id: c.id,
          nombre: c.nombre,
          enfermedad: c.enfermedad,
          dosis_total: c.dosis_total,
        }))
        setCatalogo(mapped)
        if (mapped[0]) setVacunaId(mapped[0].id)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el catalogo.'
        toast.error(msg, 'Catalogo')
      }
    })()
  }, [toast])

  // ---- Permisos camera ----------------------------------------------------

  useEffect(() => {
    if (!permission) return
    if (!permission.granted && permission.canAskAgain) {
      requestPermission()
    }
  }, [permission, requestPermission])

  // ---- Lectura del QR -----------------------------------------------------

  const handleScan = useCallback(async (result: BarcodeScanningResult) => {
    if (lockRef.current) return
    if (!result?.data) return

    const raw = String(result.data).trim()
    // Aceptamos URLs tipo https://host/verificar/TOKEN o el token plano
    const match = raw.match(/\/verificar\/([^/?#\s]+)/i)
    const token = match?.[1] ?? raw

    if (!token || token.length < 8) {
      setErrorScan('El codigo escaneado no parece un QR PIA-IA.')
      return
    }

    lockRef.current = true
    setTokenLeido(token)
    setEtapa('verificando')
    setErrorScan('')

    // Vibracion suave al detectar un QR (antes de saber si es valido)
    Haptics.selectionAsync().catch(() => {})

    try {
      const v = await certificadosApi.verificarToken(token)
      if (!v.valido) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
        setErrorScan('El QR es invalido o caduco (vigencia 24h). Pide al ciudadano uno nuevo.')
        setEtapa('escaneando')
        setTokenLeido(null)
        setTimeout(() => { lockRef.current = false }, 1200)
        return
      }
      // Vibracion de exito al verificar correctamente
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      setPaciente(v.usuario)
      setResumen(v.resumen ?? [])
      setEtapa('listo')
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      const msg = e instanceof Error ? e.message : 'No se pudo verificar el QR.'
      setErrorScan(msg)
      setEtapa('escaneando')
      setTokenLeido(null)
      setTimeout(() => { lockRef.current = false }, 1200)
    }
  }, [])

  // ---- Submit del form ----------------------------------------------------

  async function registrar() {
    setErrorRegistro('')
    if (!tokenLeido) {
      setErrorRegistro('Token no detectado.')
      return
    }
    if (!actorCurp) {
      setErrorRegistro('Sesion administrativa no detectada.')
      return
    }
    if (!vacunaId) {
      setErrorRegistro('Selecciona la vacuna a aplicar.')
      return
    }
    const dosisN = Number(numDosis)
    if (!Number.isInteger(dosisN) || dosisN < 1) {
      setErrorRegistro('El numero de dosis debe ser un entero mayor o igual a 1.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAplicacion)) {
      setErrorRegistro('Fecha invalida. Usa el formato AAAA-MM-DD.')
      return
    }

    setEtapa('registrando')
    const nombreVac = catalogo.find((v) => v.id === vacunaId)?.nombre ?? 'vacuna'
    try {
      const r = await certificadosApi.aplicarPorToken({
        token: tokenLeido,
        vacuna_id: vacunaId,
        numero_dosis: dosisN,
        fecha_aplicacion: fechaAplicacion,
        lugar_aplicacion: lugar.trim() || undefined,
        lote: lote.trim() || undefined,
        actor_curp: actorCurp,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      toast.success(`Dosis ${dosisN} de ${nombreVac} registrada (id ${r.id}).`, 'Registrado')
      setEtapa('exito')
    } catch (e) {
      // Si el fallo es por red (sin status HTTP), encolamos offline en lugar de perder la captura.
      const err = e as ApiError
      const esRed = !err?.status
      if (esRed && paciente) {
        try {
          await offlineQueue.enqueue({
            curp_usuario: paciente.curp,
            vacuna_id: vacunaId,
            numero_dosis: dosisN,
            fecha_aplicacion: fechaAplicacion,
            lugar_aplicacion: lugar.trim() || undefined,
            lote: lote.trim() || undefined,
            actor_curp: actorCurp,
            paciente_nombre: [paciente.nombre, paciente.apellido_paterno].filter(Boolean).join(' '),
            vacuna_nombre: nombreVac,
          })
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
          toast.info(
            'Sin conexion: la dosis quedo en la bandeja offline y se enviara automaticamente cuando vuelva la red.',
            'Guardada offline',
          )
          setEtapa('exito')
          return
        } catch (e2) {
          const m2 = e2 instanceof Error ? e2.message : 'No se pudo guardar offline.'
          setErrorRegistro(m2)
          setEtapa('listo')
          return
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      const msg = err instanceof Error ? err.message : 'No se pudo registrar la dosis.'
      setErrorRegistro(msg)
      setEtapa('listo')
    }
  }

  function reiniciarEscaneo() {
    lockRef.current = false
    setTokenLeido(null)
    setPaciente(null)
    setResumen([])
    setNumDosis('1')
    setFechaAplicacion(new Date().toISOString().slice(0, 10))
    setLugar('')
    setLote('')
    setErrorRegistro('')
    setErrorScan('')
    if (catalogo[0]) setVacunaId(catalogo[0].id)
    setEtapa('escaneando')
  }

  // ---- Renders ------------------------------------------------------------

  if (authorized !== true) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} />
  }

  // 1) Sin permiso de camara
  if (permission && !permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
        <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' }}>
          <Text variant="eyebrow" color="muted">Permiso requerido</Text>
          <Text variant="h1">
            La camara{'\n'}<Text variant="h1" italic>esta cerrada.</Text>
          </Text>
          <Text variant="body" color="muted">
            Necesitamos acceso a la camara para escanear el QR personal del ciudadano y registrar la dosis.
          </Text>
          {!permission.canAskAgain ? (
            <Alert
              tipo="advertencia"
              titulo="Permiso bloqueado"
              mensaje="Activa la camara desde los ajustes del dispositivo y vuelve a intentarlo."
            />
          ) : null}
          <View style={{ gap: spacing.sm }}>
            <Button label="Permitir camara" onPress={requestPermission} />
            <Button label="Volver al panel" variant="ghost" onPress={() => router.replace('/admin')} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="eyebrow" color="muted">Aplicar dosis · escaneo</Text>
            <Text variant="h2" style={{ marginTop: spacing.xs }}>
              QR del{' '}<Text variant="h2" italic>ciudadano</Text>
            </Text>
          </View>
          <Pressable onPress={() => router.replace('/admin')} hitSlop={8}>
            <Text variant="eyebrow" color="muted">CERRAR ↗</Text>
          </Pressable>
        </View>

        {etapa === 'escaneando' || etapa === 'verificando' ? (
          <View style={{ flex: 1 }}>
            <View style={{ aspectRatio: 1, width: '100%', backgroundColor: colors.ink }}>
              {permission?.granted ? (
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={etapa === 'escaneando' ? handleScan : undefined}
                />
              ) : null}
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: '70%', aspectRatio: 1, borderColor: colors.paper, borderWidth: 2 }} />
              </View>
              {etapa === 'verificando' ? (
                <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, alignItems: 'center' }}>
                  <View style={{ backgroundColor: 'rgba(245,241,232,0.94)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                    <Text variant="eyebrow" color="muted">Verificando token...</Text>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={{ padding: spacing.xl, gap: spacing.md }}>
              <Text variant="body" color="muted">
                Apunta a un QR generado desde la cartilla del ciudadano (caduca cada 24 horas).
              </Text>
              {errorScan ? <Alert tipo="error" titulo="QR no valido" mensaje={errorScan} /> : null}
            </View>
          </View>
        ) : null}

        {(etapa === 'listo' || etapa === 'registrando' || etapa === 'exito') && paciente ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl }}
          >
            {/* Tarjeta paciente */}
            <View style={{ borderWidth: 1, borderColor: colors.ink, padding: spacing.lg, gap: spacing.xs }}>
              <Text variant="eyebrow" color="moss">Ciudadano verificado</Text>
              <Text variant="h2" style={{ marginTop: spacing.xs }}>
                {paciente.nombre} {paciente.apellido_paterno} {paciente.apellido_materno ?? ''}
              </Text>
              <Text variant="mono" color="muted" style={{ letterSpacing: 1.2 }}>
                CURP {paciente.curp}
              </Text>
              {paciente.grupo_prioritario ? (
                <View style={{ alignSelf: 'flex-start', marginTop: spacing.sm, backgroundColor: colors.mossSoft, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                  <Text variant="eyebrow" style={{ color: colors.mossDark }}>{paciente.grupo_prioritario}</Text>
                </View>
              ) : null}
              {resumen && resumen.length ? (
                <Text variant="small" color="muted" style={{ marginTop: spacing.sm }}>
                  {resumen.filter((r) => r.completa).length}/{resumen.length} esquemas completos
                </Text>
              ) : null}
            </View>

            {etapa === 'exito' ? (
              <>
                <Alert tipo="exito" titulo="Dosis registrada" mensaje="La aplicacion quedo asociada al ciudadano y se registro en auditoria." />
                <View style={{ gap: spacing.sm }}>
                  <Button label="Escanear otro ciudadano" onPress={reiniciarEscaneo} arrow />
                  <Button label="Volver al panel" variant="ghost" onPress={() => router.replace('/admin')} />
                </View>
              </>
            ) : (
              <>
                <View>
                  <Text variant="eyebrow" color="muted">Registrar dosis</Text>
                  <Text variant="h2" style={{ marginTop: spacing.xs }}>
                    Datos de la{' '}<Text variant="h2" italic>aplicacion</Text>
                  </Text>
                </View>

                {/* Selector de vacuna */}
                <View style={{ gap: spacing.sm }}>
                  <Text variant="eyebrow" color="muted">Vacuna</Text>
                  {catalogo.length === 0 ? (
                    <Text variant="small" color="muted">Cargando catalogo...</Text>
                  ) : (
                    <View style={{ borderWidth: 1, borderColor: colors.border }}>
                      {catalogo.map((v, i) => {
                        const active = v.id === vacunaId
                        return (
                          <Pressable
                            key={v.id}
                            onPress={() => setVacunaId(v.id)}
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm + 2,
                              borderTopWidth: i === 0 ? 0 : 1,
                              borderTopColor: colors.borderSoft,
                              backgroundColor: active ? colors.mossSoft : 'transparent',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: spacing.md,
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text variant="body" bold color={active ? 'mossDark' : 'ink'}>{v.nombre}</Text>
                              <Text variant="small" color="muted">{v.enfermedad}</Text>
                            </View>
                            <Text variant="mono" color="muted">{v.dosis_total}d</Text>
                          </Pressable>
                        )
                      })}
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Numero de dosis"
                      value={numDosis}
                      onChangeText={(t) => setNumDosis(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={2}
                      mono
                    />
                  </View>
                  <View style={{ flex: 1.4 }}>
                    <Field
                      label="Fecha (AAAA-MM-DD)"
                      value={fechaAplicacion}
                      onChangeText={setFechaAplicacion}
                      placeholder="2026-05-13"
                      maxLength={10}
                      mono
                    />
                  </View>
                </View>

                <Field
                  label="Lugar de aplicacion (opcional)"
                  value={lugar}
                  onChangeText={setLugar}
                  placeholder="Ej. UMF 7, Centro de Salud..."
                />

                <Field
                  label="Lote (opcional)"
                  value={lote}
                  onChangeText={setLote}
                  placeholder="Ej. ABC123"
                  mono
                />

                {errorRegistro ? <Alert tipo="error" titulo="No se pudo registrar" mensaje={errorRegistro} /> : null}

                <View style={{ gap: spacing.sm }}>
                  <Button
                    label={etapa === 'registrando' ? 'Registrando...' : 'Registrar dosis'}
                    loading={etapa === 'registrando'}
                    arrow={etapa !== 'registrando'}
                    onPress={registrar}
                  />
                  <Button label="Escanear otro QR" variant="ghost" onPress={reiniciarEscaneo} />
                </View>
              </>
            )}
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
