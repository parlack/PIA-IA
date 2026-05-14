/**
 * Panel medico mobile — Registro de dosis al momento.
 *
 * Flujo:
 *  1) Medico autenticado (rol = 'medico' validado en useEffect).
 *  2) Escanea QR personal del paciente con expo-camera (BarCodeScanner).
 *  3) Endpoint /certificados/verificar/{token} valida y devuelve usuario + resumen.
 *  4) Selecciona vacuna, dosis, lugar y lote.
 *  5) POST /certificados/aplicar-por-token con `actor_curp` = CURP del medico.
 *
 * La fecha y hora se capturan automaticamente al guardar (registrado_en).
 */
import { useCallback, useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'

import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ChipSelector } from '@/components/ui/ChipSelector'
import { useToast } from '@/components/ui/Toast'

import {
  certificadosApi,
  type UsuarioVerificado,
  type ResumenVacuna,
} from '@/api/certificados'
import { adminApi } from '@/api/admin'
import type { CatalogoVacunaRow } from '@/types/admin'

import { sessionStore } from '@/hooks/useSession'
import { normalizarCurp, esCurpValida } from '@/utils/curp'
import { colors, spacing } from '@/theme'

type Fase = 'scan' | 'manual' | 'paciente' | 'registrar' | 'exito'

const LUGARES_APLICACION = [
  'UMF',
  'Hospital',
  'Centro de salud',
  'Campania escolar',
  'Brigada movil',
  'Domiciliaria',
  'Modulo de vacunacion',
] as const

export default function MedicoScreen() {
  const toast = useToast()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [nombreMedico, setNombreMedico] = useState('')
  const [curpMedico, setCurpMedico] = useState('')

  const [permission, requestPermission] = useCameraPermissions()

  const [fase, setFase] = useState<Fase>('scan')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [scanning, setScanning] = useState(true)

  const [tokenPaciente, setTokenPaciente] = useState('')
  const [pacienteCurp, setPacienteCurp] = useState('')
  const [paciente, setPaciente] = useState<UsuarioVerificado | null>(null)
  const [resumen, setResumen] = useState<ResumenVacuna[]>([])

  const [catalogo, setCatalogo] = useState<CatalogoVacunaRow[]>([])

  const [form, setForm] = useState({
    vacuna_id: 0,
    numero_dosis: 1,
    lugar_aplicacion: '',
    lote: '',
  })

  const [ultimaDosis, setUltimaDosis] = useState<{ vacuna: string; numero: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      const medico = await sessionStore.isMedico()
      const auth = await sessionStore.isAuthenticated()
      if (!medico) {
        const rol = await sessionStore.getRol()
        if (rol === 'admin') {
          router.replace('/admin')
        } else {
          router.replace('/inicio')
        }
        return
      }
      if (!auth) {
        router.replace('/login')
        return
      }
      const n = await sessionStore.getUserName()
      const c = await sessionStore.getCurp()
      if (n) setNombreMedico(n)
      if (c) setCurpMedico(c)
      setAuthorized(true)
    })()
  }, [])

  useEffect(() => {
    adminApi.listarCatalogo().then(setCatalogo).catch(() => {})
  }, [])

  const procesarToken = useCallback(async (token: string) => {
    if (cargando) return
    setCargando(true)
    setError('')
    try {
      const data = await certificadosApi.verificarToken(token)
      if (!data.valido) {
        throw new Error('Token invalido o expirado.')
      }
      setTokenPaciente(token)
      setPacienteCurp(data.usuario.curp)
      setPaciente(data.usuario)
      setResumen(data.resumen || [])
      setScanning(false)
      setFase('paciente')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo verificar el codigo.'
      setError(msg)
      setScanning(true) // permitir reintento
    } finally {
      setCargando(false)
    }
  }, [cargando])

  function onScan({ data }: { data: string }) {
    if (!scanning || cargando) return
    setScanning(false)
    // Algunos QR vienen como URL; extraemos el token si aplica.
    const token = data.includes('/verificar/')
      ? (data.split('/verificar/').pop() || '').replace(/[/?#].*$/, '')
      : data.trim()
    if (!token) {
      setScanning(true)
      return
    }
    procesarToken(token)
  }

  async function buscarPorCurp() {
    const curp = normalizarCurp(pacienteCurp)
    if (!esCurpValida(curp)) {
      setError('La CURP debe tener 18 caracteres validos.')
      return
    }
    setCargando(true)
    setError('')
    try {
      const r = await certificadosApi.obtenerTokenQr(curp)
      await procesarToken(r.token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se encontro el paciente.')
    } finally {
      setCargando(false)
    }
  }

  function abrirRegistro(vacunaId: number) {
    const v = catalogo.find(c => c.id === vacunaId)
    const r = resumen.find(x => x.vacuna_id === vacunaId)
    setForm({
      vacuna_id: vacunaId,
      numero_dosis: r
        ? Math.min((r.dosis_aplicadas || 0) + 1, v?.dosis_total || 1)
        : 1,
      lugar_aplicacion: '',
      lote: '',
    })
    setError('')
    setFase('registrar')
  }

  async function aplicarDosis() {
    setError('')
    if (!form.vacuna_id) {
      setError('Selecciona una vacuna.')
      return
    }
    if (form.numero_dosis < 1) {
      setError('El numero de dosis debe ser al menos 1.')
      return
    }
    setCargando(true)
    try {
      const hoy = new Date().toISOString().slice(0, 10)
      await certificadosApi.aplicarPorToken({
        token: tokenPaciente,
        vacuna_id: form.vacuna_id,
        numero_dosis: form.numero_dosis,
        fecha_aplicacion: hoy,
        lugar_aplicacion: form.lugar_aplicacion.trim() || undefined,
        lote: form.lote.trim() || undefined,
        actor_curp: curpMedico,
      })
      const vac = catalogo.find(c => c.id === form.vacuna_id)
      setUltimaDosis({
        vacuna: vac?.nombre || 'Vacuna',
        numero: form.numero_dosis,
      })
      toast.success('Dosis registrada en la cartilla del paciente.', 'OK')
      setFase('exito')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo registrar la dosis.'
      setError(msg)
      toast.error(msg, 'Error')
    } finally {
      setCargando(false)
    }
  }

  function nuevoPaciente() {
    setTokenPaciente('')
    setPacienteCurp('')
    setPaciente(null)
    setResumen([])
    setUltimaDosis(null)
    setError('')
    setScanning(true)
    setFase('scan')
  }

  function volverAPaciente() {
    setFase('paciente')
    setError('')
  }

  async function handleLogout() {
    await sessionStore.logout()
    router.replace('/login')
  }

  if (authorized !== true) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} />
  }

  const sumario = resumen.length
    ? {
        completas: resumen.filter(r => r.completa).length,
        pendientes: resumen.filter(r => !r.completa).length,
        total: resumen.length,
      }
    : null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg }}
      >
        {/* Header */}
        <View
          style={{
            borderBottomWidth: 2,
            borderBottomColor: colors.ink,
            paddingBottom: spacing.lg,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="eyebrow" color="muted">Panel medico</Text>
            <Text variant="display" style={{ marginTop: spacing.sm, fontSize: 32, lineHeight: 36 }}>
              Registro de{'\n'}
              <Text variant="display" italic style={{ fontSize: 32, lineHeight: 36 }}>
                dosis.
              </Text>
            </Text>
            {nombreMedico ? (
              <Text variant="small" color="muted" style={{ marginTop: spacing.sm }}>
                {nombreMedico}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={handleLogout}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesion"
          >
            <Text variant="eyebrow" color="muted">SALIR ↗</Text>
          </Pressable>
        </View>

        {/* FASE: SCAN */}
        {fase === 'scan' ? (
          <View style={{ gap: spacing.lg }}>
            <View>
              <Text variant="eyebrow" color="muted">Paso 1</Text>
              <Text variant="h1" style={{ marginTop: spacing.xs }}>
                Escanea el <Text variant="h1" italic>QR del paciente.</Text>
              </Text>
              <Text variant="small" color="muted" style={{ marginTop: spacing.sm }}>
                Pide al ciudadano que abra su cartilla y muestre su codigo QR personal.
              </Text>
            </View>

            <View style={styles.scannerFrame}>
              {!permission ? (
                <View style={styles.scannerFallback}>
                  <ActivityIndicator color={colors.paper} />
                </View>
              ) : !permission.granted ? (
                <View style={styles.scannerFallback}>
                  <Text variant="eyebrow" color="paper" style={{ opacity: 0.7 }}>Sin permiso</Text>
                  <Text variant="small" color="paper" style={{ marginTop: spacing.sm, opacity: 0.85, textAlign: 'center' }}>
                    Necesitamos acceso a la camara para leer el QR del paciente.
                  </Text>
                  <View style={{ marginTop: spacing.md, alignSelf: 'center' }}>
                    <Button label="Dar permiso" variant="ghost" onPress={requestPermission} />
                  </View>
                </View>
              ) : (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanning ? onScan : undefined}
                  facing="back"
                />
              )}
            </View>

            <Pressable
              onPress={() => { setFase('manual'); setError('') }}
              accessibilityRole="button"
              style={{ alignSelf: 'flex-start', paddingVertical: spacing.xs }}
            >
              <Text variant="eyebrow">Buscar por CURP manualmente →</Text>
            </Pressable>

            {error ? (
              <View
                style={{
                  borderLeftWidth: 2,
                  borderLeftColor: colors.wine,
                  paddingLeft: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text variant="small" color="wine">{error}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* FASE: MANUAL */}
        {fase === 'manual' ? (
          <View style={{ gap: spacing.lg }}>
            <View>
              <Text variant="eyebrow" color="muted">Busqueda manual</Text>
              <Text variant="h1" style={{ marginTop: spacing.xs }}>CURP del paciente</Text>
              <Text variant="small" color="muted" style={{ marginTop: spacing.sm }}>
                Si el QR no esta disponible, ingresa la CURP de 18 caracteres.
              </Text>
            </View>

            <Field
              label="CURP"
              value={pacienteCurp}
              onChangeText={(t) => setPacienteCurp(normalizarCurp(t))}
              placeholder="XXXX000000XXXXXXXX"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={18}
              mono
              returnKeyType="search"
              onSubmitEditing={buscarPorCurp}
            />

            {error ? (
              <View
                style={{
                  borderLeftWidth: 2,
                  borderLeftColor: colors.wine,
                  paddingLeft: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text variant="small" color="wine">{error}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={cargando ? 'Buscando...' : 'Continuar'}
                  loading={cargando}
                  arrow={!cargando}
                  onPress={buscarPorCurp}
                />
              </View>
              <Button
                label="Volver al QR"
                variant="ghost"
                onPress={() => { setFase('scan'); setError(''); setScanning(true) }}
              />
            </View>
          </View>
        ) : null}

        {/* FASE: PACIENTE */}
        {fase === 'paciente' && paciente ? (
          <View style={{ gap: spacing.lg }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text variant="eyebrow" color="muted">Paciente identificado</Text>
                  <Text variant="h1" style={{ marginTop: spacing.xs }}>
                    {paciente.nombre} {paciente.apellido_paterno}
                    {paciente.apellido_materno ? ` ${paciente.apellido_materno}` : ''}
                  </Text>
                  <Text variant="mono" color="muted" style={{ marginTop: spacing.xs, fontSize: 11, letterSpacing: 1.2 }}>
                    {paciente.curp}
                  </Text>
                </View>
                <Pressable onPress={nuevoPaciente} hitSlop={8} accessibilityRole="button">
                  <Text variant="eyebrow" color="muted">CAMBIAR ↗</Text>
                </Pressable>
              </View>
            </View>

            {sumario ? (
              <View style={{ flexDirection: 'row', gap: spacing.xl }}>
                <Stat n={sumario.completas} label="Completas" />
                <Stat
                  n={sumario.pendientes}
                  label="Pendientes"
                  highlight={sumario.pendientes > 0}
                />
                <Stat n={sumario.total} label="Vacunas" />
              </View>
            ) : null}

            <View>
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="h2">Aplicar dosis</Text>
                <Text variant="eyebrow" color="muted">Elige la vacuna</Text>
              </View>

              {resumen.length === 0 ? (
                <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
                  <Text variant="h2" italic color="muted" style={{ textAlign: 'center', fontSize: 18 }}>
                    Sin vacunas en su esquema todavia.
                  </Text>
                  {catalogo.length ? (
                    <View style={{ marginTop: spacing.md }}>
                      <Button
                        label="Registrar primera dosis"
                        onPress={() => abrirRegistro(catalogo[0]!.id)}
                        arrow
                      />
                    </View>
                  ) : null}
                </View>
              ) : (
                resumen.map((r, i) => {
                  const dosisProx = Math.min(r.dosis_aplicadas + 1, r.dosis_total)
                  return (
                    <Pressable
                      key={r.vacuna_id}
                      onPress={() => !r.completa && abrirRegistro(r.vacuna_id)}
                      disabled={r.completa}
                      style={({ pressed }) => [
                        {
                          paddingVertical: spacing.md,
                          borderBottomWidth: i < resumen.length - 1 ? 1 : 0,
                          borderBottomColor: colors.borderSoft,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: spacing.md,
                          opacity: r.completa ? 0.5 : pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text variant="body" bold numberOfLines={1}>{r.nombre}</Text>
                        <Text variant="small" color="muted" style={{ marginTop: 2 }}>
                          {r.dosis_aplicadas} de {r.dosis_total} dosis
                        </Text>
                      </View>
                      {r.completa ? (
                        <Text variant="mono" color="moss" style={{ fontSize: 10, letterSpacing: 1 }}>
                          COMPLETA
                        </Text>
                      ) : (
                        <Text variant="mono" color="moss" style={{ fontSize: 12, letterSpacing: 0.5 }}>
                          + DOSIS {dosisProx} →
                        </Text>
                      )}
                    </Pressable>
                  )
                })
              )}
            </View>

            {error ? (
              <View
                style={{
                  borderLeftWidth: 2,
                  borderLeftColor: colors.wine,
                  paddingLeft: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text variant="small" color="wine">{error}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* FASE: EXITO */}
        {fase === 'exito' && paciente && ultimaDosis ? (
          <View
            style={{
              borderLeftWidth: 4,
              borderLeftColor: colors.moss,
              paddingLeft: spacing.lg,
              paddingVertical: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Text variant="eyebrow" color="moss">Dosis registrada</Text>
            <Text variant="h1">
              {ultimaDosis.vacuna}{' '}
              <Text variant="h1" italic color="muted">dosis {ultimaDosis.numero}.</Text>
            </Text>
            <Text variant="small" color="muted">
              Quedo registrada en la cartilla de{' '}
              <Text bold>{paciente.nombre} {paciente.apellido_paterno}</Text>
              {' '}con fecha y hora de hoy.
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Button label="Otra dosis al mismo" onPress={volverAPaciente} arrow />
              </View>
              <Button label="Nuevo paciente" variant="ghost" onPress={nuevoPaciente} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal de registro (overlay) */}
      <Modal
        visible={fase === 'registrar'}
        onClose={volverAPaciente}
        eyebrow="Registrar dosis"
        title={catalogo.find(c => c.id === form.vacuna_id)?.nombre || ''}
      >
        {paciente ? (
          <Text variant="small" color="muted">
            Paciente: <Text variant="mono" color="muted" style={{ fontSize: 11, letterSpacing: 1 }}>{paciente.curp}</Text>{'\n'}
            {paciente.nombre} {paciente.apellido_paterno}
          </Text>
        ) : null}

        <Field
          label="Numero de dosis"
          value={String(form.numero_dosis)}
          onChangeText={(t) =>
            setForm({
              ...form,
              numero_dosis: Math.max(1, parseInt(t.replace(/[^0-9]/g, '') || '1', 10)),
            })
          }
          keyboardType="number-pad"
        />

        <ChipSelector
          label="Lugar de aplicacion"
          options={LUGARES_APLICACION}
          value={form.lugar_aplicacion}
          onChange={(v) => setForm({ ...form, lugar_aplicacion: v })}
          allowCustom
          customLabel="Otro..."
          customPlaceholder="Ej. UMF #43, campania..."
        />

        <Field
          label="Lote (opcional)"
          value={form.lote}
          onChangeText={(t) => setForm({ ...form, lote: t })}
          placeholder="LOT-XXX-000"
          maxLength={60}
          mono
        />

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: spacing.sm,
            gap: spacing.xs / 2,
          }}
        >
          <Text variant="mono" color="muted" style={{ fontSize: 10, letterSpacing: 1.1 }}>
            FECHA · {new Date().toLocaleDateString('es-MX')}
          </Text>
          <Text variant="mono" color="muted" style={{ fontSize: 10, letterSpacing: 1.1 }}>
            HORA · {new Date().toLocaleTimeString('es-MX')}
          </Text>
          <Text variant="mono" color="muted" style={{ fontSize: 10, letterSpacing: 1.1 }}>
            FIRMADO POR · {curpMedico}
          </Text>
        </View>

        {error ? (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: colors.wine,
              paddingLeft: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Text variant="small" color="wine">{error}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label={cargando ? 'Registrando...' : 'Aplicar dosis'}
              loading={cargando}
              onPress={aplicarDosis}
              arrow={!cargando}
            />
          </View>
          <Button label="Cancelar" variant="ghost" onPress={volverAPaciente} />
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function Stat({
  n,
  label,
  highlight,
}: {
  n: number
  label: string
  highlight?: boolean
}) {
  return (
    <View style={{ minWidth: 60 }}>
      <Text
        variant="display"
        color={highlight ? 'wine' : 'ink'}
        style={{ fontSize: 32, lineHeight: 34 }}
      >
        {n}
      </Text>
      <Text variant="eyebrow" color="muted" style={{ marginTop: 2 }}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scannerFrame: {
    borderWidth: 2,
    borderColor: colors.ink,
    aspectRatio: 4 / 3,
    overflow: 'hidden',
    backgroundColor: colors.mossDark,
    position: 'relative',
  },
  scannerFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
})
