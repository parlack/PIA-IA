import { useState } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'

import { useAuth } from '@/hooks/useAuth'
import { normalizarCurp } from '@/utils/curp'
import { colors, spacing } from '@/theme'

type Tab = 'consulta' | 'acceso'

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>('consulta')
  const [curp, setCurp] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuth()

  async function handleSubmit() {
    const res = await login(curp, tab === 'acceso' ? password : undefined)
    if (res === 'autenticado' || res === 'basico' || res === 'no_registrado') {
      router.replace('/dashboard')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Hero verde profundo */}
        <View style={{ backgroundColor: colors.mossDark, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 36, height: 36, backgroundColor: colors.moss, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="display" color="paper" style={{ fontSize: 18, lineHeight: 18 }}>P</Text>
            </View>
            <View>
              <Text variant="eyebrow" color="paper" style={{ opacity: 0.7 }}>PIA · IA</Text>
              <Text variant="eyebrow" color="paper" style={{ opacity: 0.7 }}>SECRETARIA DE SALUD</Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.xxl }}>
            <Text variant="eyebrow" style={{ color: colors.mossSoft }}>Sistema Nacional de Inmunizacion</Text>
            <Text variant="display" color="paper" style={{ marginTop: spacing.md }}>
              Tu cartilla{'\n'}<Text variant="display" color="paper" italic>de vacunacion,</Text>{'\n'}siempre contigo.
            </Text>
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
          <View>
            <Text variant="eyebrow" color="muted">Acceso ciudadano</Text>
            <Text variant="h1" style={{ marginTop: spacing.sm }}>Identificate</Text>
            <Text variant="small" color="muted" style={{ marginTop: spacing.xs }}>Selecciona como deseas continuar.</Text>
          </View>

          <Tabs<Tab>
            value={tab}
            onChange={(v) => { setTab(v); setPassword('') }}
            options={[
              { key: 'consulta', label: 'Consulta rapida' },
              { key: 'acceso',   label: 'Acceso completo' },
            ]}
          />

          <Text variant="small" color="muted">
            {tab === 'consulta'
              ? 'Solo necesitas tu CURP. Ideal para consultar tu historial sin recordar contrasenas.'
              : 'Ingresa con CURP y contrasena para gestionar tu expediente completo.'}
          </Text>

          <Field
            label="CURP"
            value={curp}
            onChangeText={(t) => setCurp(normalizarCurp(t))}
            placeholder="XXXX000000XXXXXXXX"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={18}
            mono
          />

          {tab === 'acceso' ? (
            <Field
              label="Contrasena"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
          ) : null}

          {error ? (
            <View style={{ borderLeftWidth: 2, borderLeftColor: colors.wine, paddingLeft: spacing.md, paddingVertical: spacing.sm, backgroundColor: 'rgba(153,27,27,0.04)' }}>
              <Text variant="small" color="wine">{error}</Text>
            </View>
          ) : null}

          <Button
            label={loading ? 'Verificando…' : (tab === 'consulta' ? 'Ver mi cartilla' : 'Iniciar sesion')}
            loading={loading}
            arrow={!loading}
            onPress={handleSubmit}
          />

          <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
            <Pressable onPress={() => {}}>
              <Text variant="eyebrow" color="muted">No conozco mi CURP →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
