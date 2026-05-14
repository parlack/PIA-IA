/**
 * Selector editorial de opciones por chips/pills.
 *
 * Reemplaza inputs de texto cuando hay un conjunto razonable de opciones
 * predefinidas. Soporta seleccion unica (single-select) y multiple
 * (multi-select). Mantiene el estilo monocromatico moss/ink coherente
 * con el resto del sistema.
 *
 * Si `customLabel` esta definido, se muestra una opcion "Otro/Otra..." que
 * activa un input de texto libre. Util cuando la lista cubre el 90% de los
 * casos pero el usuario necesita escapar a algo no listado.
 *
 * Uso single-select:
 *   <ChipSelector
 *     label="Relacion"
 *     options={['Madre','Padre','Hijo','Hija']}
 *     value={form.relacion}
 *     onChange={(v) => setForm({ ...form, relacion: v })}
 *     allowCustom
 *   />
 *
 * Uso multi-select:
 *   <ChipSelector
 *     label="Sintomas"
 *     options={SINTOMAS}
 *     value={form.sintomas}        // string[]
 *     onChange={(v) => setForm({ ...form, sintomas: v })}
 *     multiple
 *   />
 */
import { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { Text } from './Text'
import { colors, spacing, typography } from '@/theme'

interface BaseProps {
  label?:        string
  options:       readonly string[]
  /** Etiqueta del chip que abre el input libre. Si no se pasa, no hay "Otro". */
  customLabel?:  string
  allowCustom?:  boolean
  customPlaceholder?: string
  helpText?:     string
}

type SingleProps = BaseProps & {
  multiple?: false
  value:     string
  onChange:  (value: string) => void
}

type MultiProps = BaseProps & {
  multiple:  true
  value:     string[]
  onChange:  (value: string[]) => void
}

type Props = SingleProps | MultiProps

const CUSTOM_LABEL_DEFAULT = 'Otro...'

export function ChipSelector(props: Props) {
  const {
    label,
    options,
    customLabel = CUSTOM_LABEL_DEFAULT,
    allowCustom,
    customPlaceholder = 'Escribe tu opcion',
    helpText,
  } = props

  const isMultiple = props.multiple === true

  function isActive(opt: string): boolean {
    if (isMultiple) return (props.value as string[]).includes(opt)
    return props.value === opt
  }

  /**
   * Modo "Otro": activo cuando el valor seleccionado NO esta en la lista
   * de opciones (single-select) o cuando el usuario abrio el input
   * explicitamente.
   */
  const valorActual =
    isMultiple
      ? ''
      : ((props as SingleProps).value ?? '')

  const valorEstaEnLista = isMultiple
    ? false
    : (options as readonly string[]).includes(valorActual)

  const [customMode, setCustomMode] = useState<boolean>(
    !isMultiple && !!valorActual && !valorEstaEnLista,
  )

  function seleccionar(opt: string) {
    if (isMultiple) {
      const current = props.value as string[]
      const next = current.includes(opt)
        ? current.filter((o) => o !== opt)
        : [...current, opt]
      ;(props as MultiProps).onChange(next)
      return
    }
    setCustomMode(false)
    ;(props as SingleProps).onChange(opt)
  }

  function activarCustom() {
    if (isMultiple) return
    setCustomMode(true)
    ;(props as SingleProps).onChange('')
  }

  function cambiarCustom(t: string) {
    if (isMultiple) return
    ;(props as SingleProps).onChange(t)
  }

  return (
    <View>
      {label ? (
        <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.xs + 2 }}>
          {label}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {options.map((opt) => {
          const activo = isActive(opt)
          return (
            <Pressable
              key={opt}
              onPress={() => seleccionar(opt)}
              accessibilityRole={isMultiple ? 'checkbox' : 'radio'}
              accessibilityState={{ selected: activo }}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.sm + 2,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: activo ? colors.ink : colors.border,
                backgroundColor: activo ? colors.ink : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                variant="small"
                color={activo ? 'paper' : 'muted'}
                style={{ fontSize: 12 }}
              >
                {opt}
              </Text>
            </Pressable>
          )
        })}

        {allowCustom && !isMultiple ? (
          <Pressable
            onPress={activarCustom}
            accessibilityRole="radio"
            accessibilityState={{ selected: customMode }}
            style={({ pressed }) => ({
              paddingHorizontal: spacing.sm + 2,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: customMode ? colors.ink : colors.border,
              backgroundColor: customMode ? colors.ink : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              variant="small"
              color={customMode ? 'paper' : 'muted'}
              style={{ fontSize: 12, fontStyle: 'italic' }}
            >
              {customLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {allowCustom && customMode && !isMultiple ? (
        <View
          style={{
            marginTop: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TextInput
            value={valorActual}
            onChangeText={cambiarCustom}
            placeholder={customPlaceholder}
            placeholderTextColor={colors.muted2}
            style={{
              fontSize: typography.sizes.md,
              paddingVertical: 6,
              paddingHorizontal: 2,
              color: colors.ink,
              fontFamily: typography.sans,
            }}
            autoFocus
          />
        </View>
      ) : null}

      {helpText ? (
        <Text variant="small" color="muted" style={{ marginTop: spacing.xs, fontSize: 11 }}>
          {helpText}
        </Text>
      ) : null}
    </View>
  )
}
