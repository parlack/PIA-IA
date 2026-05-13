<script setup lang="ts">
import { esRolAdmin } from '~/utils/rol'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Verificar cartilla' })

const route = useRoute()
const api = useApi()

const cargando = ref(true)
const valido = ref(false)
const usuario = ref<any>(null)
const resumen = ref<any[]>([])
const totalDosis = ref(0)
const errorMsg = ref('')

const sesionAdmin = ref(false)
const actorCurp = ref<string | null>(null)

const token = computed(() => String(route.params.token || ''))

const catalogo = ref<{ id: number; nombre: string; enfermedad: string; dosis_total: number }[]>([])
const form = ref({
  vacuna_id: 0,
  numero_dosis: 1,
  fecha_aplicacion: new Date().toISOString().slice(0, 10),
  lugar_aplicacion: '',
  lote: '',
})
const guardando = ref(false)
const exitoMsg = ref('')
const errorRegistro = ref('')

onMounted(async () => {
  if (typeof localStorage !== 'undefined') {
    const auth = localStorage.getItem('auth')
    const rol = localStorage.getItem('rol')
    const curp = localStorage.getItem('curp')
    if (auth === 'true' && esRolAdmin(rol) && curp) {
      sesionAdmin.value = true
      actorCurp.value = curp
    }
  }

  if (!token.value) {
    errorMsg.value = 'Token no provisto.'
    cargando.value = false
    return
  }
  try {
    const r = await api.verificarQr(token.value)
    valido.value = r.valido
    if (r.valido) {
      usuario.value = r.usuario
      resumen.value = r.resumen || []
      totalDosis.value = r.total_dosis || 0
      if (sesionAdmin.value) {
        try {
          const cat = await api.getCatalogo()
          catalogo.value = cat
          if (cat.length > 0) form.value.vacuna_id = cat[0]!.id
        } catch (e: any) {
          // si no se puede cargar catalogo, el form mostrara mensaje
          errorRegistro.value = e?.message ?? 'No se pudo cargar el catalogo de vacunas.'
        }
      }
    }
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Error al verificar el QR.'
  } finally {
    cargando.value = false
  }
})

const completas = computed(() => resumen.value.filter((r: any) => r.completa).length)
const pendientes = computed(() => resumen.value.filter((r: any) => !r.completa).length)
const porcentaje = computed(() =>
  resumen.value.length ? Math.round((completas.value / resumen.value.length) * 100) : 0,
)

const grupoLabel: Record<string, string> = {
  adulto_mayor: 'Adulto mayor',
  embarazada: 'Embarazada',
  personal_salud: 'Personal de salud',
  cronico: 'Cronico',
}

async function registrarDosis() {
  errorRegistro.value = ''
  exitoMsg.value = ''

  if (!actorCurp.value) {
    errorRegistro.value = 'Sesion administrativa no detectada. Vuelve a iniciar sesion.'
    return
  }
  if (!form.value.vacuna_id) {
    errorRegistro.value = 'Selecciona la vacuna a aplicar.'
    return
  }
  if (!form.value.numero_dosis || form.value.numero_dosis < 1) {
    errorRegistro.value = 'El numero de dosis debe ser al menos 1.'
    return
  }
  if (!form.value.fecha_aplicacion) {
    errorRegistro.value = 'Selecciona la fecha de aplicacion.'
    return
  }

  guardando.value = true
  try {
    const r = await api.aplicarDosisPorQr({
      token: token.value,
      vacuna_id: form.value.vacuna_id,
      numero_dosis: form.value.numero_dosis,
      fecha_aplicacion: form.value.fecha_aplicacion,
      lugar_aplicacion: form.value.lugar_aplicacion?.trim() || undefined,
      lote: form.value.lote?.trim() || undefined,
      actor_curp: actorCurp.value,
    })
    const nombreVac = catalogo.value.find((v) => v.id === form.value.vacuna_id)?.nombre ?? 'vacuna'
    exitoMsg.value = `Dosis #${form.value.numero_dosis} de ${nombreVac} registrada (id ${r.id}).`

    // refrescamos resumen
    try {
      const fresh = await api.verificarQr(token.value)
      if (fresh.valido) {
        resumen.value = fresh.resumen || []
        totalDosis.value = fresh.total_dosis || 0
      }
    } catch {
      // ignorar
    }

    // reset form parcial
    form.value.numero_dosis = 1
    form.value.lugar_aplicacion = ''
    form.value.lote = ''
  } catch (e: any) {
    errorRegistro.value = e?.message ?? 'No se pudo registrar la dosis.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 py-10">
    <div class="max-w-2xl w-full">
      <div v-if="cargando" class="text-center py-20">
        <p class="eyebrow">Verificando</p>
        <p class="font-display text-3xl mt-3">Validando codigo QR…</p>
      </div>

      <div v-else-if="!valido" class="text-center py-20">
        <p class="eyebrow" style="color: var(--wine)">QR invalido o caducado</p>
        <h1 class="font-display text-4xl mt-4" style="font-weight: 400">
          No se pudo<br/><em class="italic" style="font-weight: 300">verificar.</em>
        </h1>
        <p class="text-sm mt-6" style="color: var(--muted)">
          {{ errorMsg || 'El codigo puede haber expirado (vigencia: 24 horas). Pide al ciudadano que genere uno nuevo.' }}
        </p>
        <NuxtLink to="/login" class="btn-ghost inline-flex items-center gap-2 mt-8">
          <span class="font-mono">←</span> Volver al inicio
        </NuxtLink>
      </div>

      <div v-else>
        <p class="eyebrow">PIA-IA / VERIFICACION OFICIAL</p>
        <h1 class="font-display text-4xl mt-3 leading-[1.05] tracking-tight" style="font-weight: 400">
          Cartilla<br/><em class="italic" style="font-weight: 300">verificada.</em>
        </h1>

        <div class="mt-8 p-6" style="background: var(--paper); border: 1px solid var(--ink)">
          <p class="text-xl" style="font-weight: 500">
            {{ usuario.nombre }} {{ usuario.apellido_paterno }} {{ usuario.apellido_materno || '' }}
          </p>
          <p class="font-mono text-xs mt-2" style="color: var(--muted); letter-spacing: 0.1em">
            CURP {{ usuario.curp }}
          </p>
          <p v-if="grupoLabel[usuario.grupo_prioritario]" class="mt-3 inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
             style="background: var(--moss-soft); color: var(--moss-dark); letter-spacing: 0.1em">
            {{ grupoLabel[usuario.grupo_prioritario] }}
          </p>
        </div>

        <div class="grid grid-cols-3 gap-4 mt-8">
          <div>
            <p class="eyebrow">Completas</p>
            <p class="font-display text-4xl mt-2 tabular" style="font-weight: 400; color: var(--moss)">{{ completas }}</p>
          </div>
          <div>
            <p class="eyebrow">Pendientes</p>
            <p class="font-display text-4xl mt-2 tabular" style="font-weight: 400; color: var(--wine)">{{ pendientes }}</p>
          </div>
          <div>
            <p class="eyebrow">Esquema</p>
            <p class="font-display text-4xl mt-2 tabular" style="font-weight: 400">{{ porcentaje }}%</p>
          </div>
        </div>

        <div class="mt-8">
          <p class="eyebrow mb-3">Total de dosis registradas</p>
          <p class="font-display text-2xl tabular" style="font-weight: 500">{{ totalDosis }}</p>
        </div>

        <!-- Form admin para registrar dosis directamente -->
        <div v-if="sesionAdmin" class="mt-12 p-6" style="background: var(--paper-2, var(--paper)); border: 1px solid var(--ink)">
          <p class="eyebrow mb-2">Sesion administrativa · {{ actorCurp }}</p>
          <h2 class="font-display text-2xl" style="font-weight: 400">
            Registrar <em class="italic" style="font-weight: 300">dosis aplicada</em>
          </h2>
          <p class="text-sm mt-2" style="color: var(--muted)">
            La dosis se asociara automaticamente a <span class="font-mono">{{ usuario.curp }}</span>.
          </p>

          <div v-if="catalogo.length === 0 && !errorRegistro" class="mt-6">
            <p class="text-sm" style="color: var(--muted)">Cargando catalogo de vacunas...</p>
          </div>

          <form v-else class="mt-6 grid gap-4" @submit.prevent="registrarDosis">
            <label class="grid gap-1">
              <span class="eyebrow">Vacuna</span>
              <select v-model.number="form.vacuna_id" class="px-3 py-2"
                      style="background: var(--paper); border: 1px solid var(--ink); font-family: inherit">
                <option v-for="v in catalogo" :key="v.id" :value="v.id">
                  {{ v.nombre }} — {{ v.enfermedad }} ({{ v.dosis_total }} dosis)
                </option>
              </select>
            </label>

            <div class="grid grid-cols-2 gap-4">
              <label class="grid gap-1">
                <span class="eyebrow">Numero de dosis</span>
                <input v-model.number="form.numero_dosis" type="number" min="1" class="px-3 py-2"
                       style="background: var(--paper); border: 1px solid var(--ink); font-family: inherit" />
              </label>
              <label class="grid gap-1">
                <span class="eyebrow">Fecha</span>
                <input v-model="form.fecha_aplicacion" type="date" class="px-3 py-2"
                       style="background: var(--paper); border: 1px solid var(--ink); font-family: inherit" />
              </label>
            </div>

            <label class="grid gap-1">
              <span class="eyebrow">Lugar de aplicacion (opcional)</span>
              <input v-model="form.lugar_aplicacion" type="text" placeholder="Ej. UMF 7, Centro de Salud..."
                     class="px-3 py-2"
                     style="background: var(--paper); border: 1px solid var(--ink); font-family: inherit" />
            </label>

            <label class="grid gap-1">
              <span class="eyebrow">Lote (opcional)</span>
              <input v-model="form.lote" type="text" placeholder="Ej. ABC123" class="px-3 py-2"
                     style="background: var(--paper); border: 1px solid var(--ink); font-family: inherit" />
            </label>

            <p v-if="errorRegistro" class="text-sm" style="color: var(--wine)">{{ errorRegistro }}</p>
            <p v-if="exitoMsg" class="text-sm" style="color: var(--moss-dark, var(--moss))">{{ exitoMsg }}</p>

            <div class="flex gap-3 mt-2">
              <button type="submit" :disabled="guardando" class="btn-primary"
                      style="background: var(--moss); color: var(--paper); padding: 0.625rem 1.25rem; font-family: inherit">
                {{ guardando ? 'Registrando...' : 'Registrar dosis' }}
              </button>
              <NuxtLink to="/admin" class="btn-ghost inline-flex items-center gap-2"
                        style="padding: 0.625rem 1rem">
                Ir al panel
              </NuxtLink>
            </div>
          </form>
        </div>

        <p v-else class="text-xs mt-10 text-center" style="color: var(--muted)">
          Verificacion realizada el {{ new Date().toLocaleString('es-MX') }}<br/>
          PIA-IA · Sistema Nacional de Inmunizacion Digital
        </p>
      </div>
    </div>
  </div>
</template>
