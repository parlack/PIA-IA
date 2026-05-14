import { useState } from 'react'
import { View } from 'react-native'
import { adminApi } from '@/api/admin'
import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ChipSelector } from '@/components/ui/ChipSelector'
import { useToast } from '@/components/ui/Toast'
import { spacing } from '@/theme'
import { normalizarCurp } from '@/utils/curp'
import { sessionStore } from '@/hooks/useSession'

type Tipo = 'informacion' | 'advertencia' | 'urgente'

const TIPOS: { key: Tipo; label: string }[] = [
  { key: 'informacion',  label: 'Informacion' },
  { key: 'advertencia',  label: 'Advertencia' },
  { key: 'urgente',      label: 'Urgente'     },
]

export function MensajesTab() {
  const toast = useToast()
  const [form, setForm] = useState({
    destinatario_curp: '',
    titulo: '',
    contenido: '',
    tipo: 'informacion' as Tipo,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function enviar() {
    setError('')
    if (!form.destinatario_curp || form.destinatario_curp.length !== 18) {
      setError('CURP destinatario invalida.')
      return
    }
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setError('Titulo y contenido son obligatorios.')
      return
    }
    setBusy(true)
    try {
      const remitente = await sessionStore.getCurp()
      const destino = form.destinatario_curp
      await adminApi.enviarMensaje({
        destinatario_curp: destino,
        titulo: form.titulo.trim(),
        contenido: form.contenido.trim(),
        tipo: form.tipo,
        remitente_curp: remitente || undefined,
      })
      setForm({ destinatario_curp: '', titulo: '', contenido: '', tipo: 'informacion' })
      toast.success(`Entregado al buzon de ${destino}.`, 'Mensaje enviado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo enviar el mensaje.'
      setError(msg)
      toast.error(msg, 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <Text variant="h2">Enviar mensaje al buzon</Text>
        <Text variant="small" color="muted" style={{ marginTop: spacing.xs }}>
          El ciudadano vera el mensaje en su buzon y recibira push si tiene token registrado.
        </Text>
      </View>

      <Field
        label="CURP destinatario"
        value={form.destinatario_curp}
        onChangeText={(t) => setForm({ ...form, destinatario_curp: normalizarCurp(t) })}
        placeholder="XXXX000000XXXXXXXX"
        autoCapitalize="characters"
        maxLength={18}
        mono
      />
      <Field
        label="Titulo"
        value={form.titulo}
        onChangeText={(t) => setForm({ ...form, titulo: t })}
        placeholder="Asunto del mensaje"
      />
      <Field
        label="Contenido"
        value={form.contenido}
        onChangeText={(t) => setForm({ ...form, contenido: t })}
        placeholder="Detalle..."
        multiline
        numberOfLines={5}
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />

      <ChipSelector
        label="Tipo"
        options={TIPOS.map((t) => t.label)}
        value={TIPOS.find((t) => t.key === form.tipo)?.label ?? 'Informacion'}
        onChange={(label) => {
          const found = TIPOS.find((t) => t.label === label)
          if (found) setForm({ ...form, tipo: found.key })
        }}
      />

      {error ? <Alert tipo="error" mensaje={error} /> : null}

      <Button label={busy ? 'Enviando...' : 'Enviar mensaje'} loading={busy} onPress={enviar} arrow={!busy} />
    </View>
  )
}
