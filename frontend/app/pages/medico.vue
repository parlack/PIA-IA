<script setup lang="ts">
/**
 * Panel medico — Registro de dosis al momento.
 *
 * Flujo:
 *  1) Medico autenticado (middleware 'medico' obliga rol + password).
 *  2) Escanea QR personal del paciente (genera un token corto en /certificados/{curp}/qr-token).
 *  3) Endpoint /certificados/verificar/{token} valida + devuelve usuario + resumen.
 *  4) Medico selecciona vacuna, numero de dosis, lugar y lote.
 *  5) POST /certificados/aplicar-por-token registra la dosis con:
 *     - fecha_aplicacion = hoy (auto)
 *     - modificado_por   = CURP del medico (actor_curp)
 *     - registrado_en    = NOW() automatico
 */
import { QrcodeStream } from 'vue-qrcode-reader'

definePageMeta({ middleware: 'medico' })
useHead({ title: 'Panel medico' })

const router = useRouter()
const api = useApi()
const session = useSession()

const nombreMedico = ref('')
const curpMedico = ref('')

type UsuarioVerificado = {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  fecha_nacimiento: string | null
  sexo: string | null
  unidad_nombre: string | null
}

type ResumenVacuna = {
  vacuna_id: number
  nombre: string
  dosis_total: number
  dosis_aplicadas: number
  completa: boolean
}

type CatalogoItem = {
  id: number
  nombre: string
  enfermedad: string
  dosis_total: number
  dosis_descripcion: string | null
}

const fase = ref<'scan' | 'manual' | 'paciente' | 'registrar' | 'exito'>('scan')
const error = ref('')
const cargando = ref(false)

const tokenPaciente = ref('')
const pacienteCurp = ref('')
const paciente = ref<UsuarioVerificado | null>(null)
const resumen = ref<ResumenVacuna[]>([])

const catalogo = ref<CatalogoItem[]>([])

const form = reactive({
  vacuna_id: 0,
  numero_dosis: 1,
  lugar_aplicacion: '',
  lote: '',
})

const ultimaDosisAplicada = ref<{ vacuna: string; numero: number } | null>(null)

const cameraSoportada = ref(true)
const cameraEnabled = ref(true)

onMounted(async () => {
  const n = session.getUserName()
  const c = session.getCurp()
  if (n) nombreMedico.value = n
  if (c) curpMedico.value = c

  try {
    catalogo.value = await api.getCatalogo() as CatalogoItem[]
  } catch (e) {
    console.error(e)
  }
})

function logout() {
  session.logout()
  router.replace('/login')
}

async function onScan(detected: { rawValue?: string }[]) {
  if (!detected.length) return
  const raw = detected[0]?.rawValue || ''
  // Algunos QR vienen como URL completa; extraemos el token si aplica.
  const token = raw.includes('/verificar/')
    ? (raw.split('/verificar/').pop() || '').replace(/[/?#].*$/, '')
    : raw.trim()

  if (!token) return
  await procesarToken(token)
}

function onCameraError(err: Error) {
  cameraSoportada.value = false
  error.value = `Camara no disponible: ${err.message}. Usa busqueda manual.`
}

async function procesarToken(token: string) {
  if (cargando.value) return
  cargando.value = true
  error.value = ''
  try {
    const data = await api.verificarQr(token) as {
      valido: boolean
      usuario?: UsuarioVerificado
      resumen?: ResumenVacuna[]
    }
    if (!data.valido || !data.usuario) {
      throw new Error('Token invalido o expirado.')
    }
    tokenPaciente.value = token
    pacienteCurp.value = data.usuario.curp
    paciente.value = data.usuario
    resumen.value = data.resumen || []
    cameraEnabled.value = false
    fase.value = 'paciente'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo verificar el codigo.'
  } finally {
    cargando.value = false
  }
}

async function buscarPorCurp() {
  if (pacienteCurp.value.length !== 18) {
    error.value = 'La CURP debe tener 18 caracteres.'
    return
  }
  cargando.value = true
  error.value = ''
  try {
    // Generamos un token temporal para el paciente, luego lo validamos.
    const r = await api.getQrToken(pacienteCurp.value.toUpperCase())
    await procesarToken(r.token)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se encontro el paciente.'
  } finally {
    cargando.value = false
  }
}

function abrirRegistro(vacunaId: number) {
  const v = catalogo.value.find(c => c.id === vacunaId)
  const r = resumen.value.find(x => x.vacuna_id === vacunaId)
  form.vacuna_id = vacunaId
  form.numero_dosis = r ? Math.min((r.dosis_aplicadas || 0) + 1, v?.dosis_total || 1) : 1
  form.lugar_aplicacion = ''
  form.lote = ''
  error.value = ''
  fase.value = 'registrar'
}

async function aplicarDosis() {
  error.value = ''
  if (!form.vacuna_id) {
    error.value = 'Selecciona una vacuna.'
    return
  }
  if (form.numero_dosis < 1) {
    error.value = 'El numero de dosis debe ser al menos 1.'
    return
  }
  cargando.value = true
  try {
    const hoy = new Date().toISOString().slice(0, 10)
    await api.aplicarDosisPorQr({
      token:             tokenPaciente.value,
      vacuna_id:         form.vacuna_id,
      numero_dosis:      form.numero_dosis,
      fecha_aplicacion:  hoy,
      lugar_aplicacion:  form.lugar_aplicacion.trim() || undefined,
      lote:              form.lote.trim() || undefined,
      actor_curp:        curpMedico.value,
    })
    const vac = catalogo.value.find(c => c.id === form.vacuna_id)
    ultimaDosisAplicada.value = {
      vacuna: vac?.nombre || 'Vacuna',
      numero: form.numero_dosis,
    }
    fase.value = 'exito'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo registrar la dosis.'
  } finally {
    cargando.value = false
  }
}

function nuevoPaciente() {
  tokenPaciente.value = ''
  pacienteCurp.value = ''
  paciente.value = null
  resumen.value = []
  ultimaDosisAplicada.value = null
  error.value = ''
  cameraEnabled.value = true
  fase.value = 'scan'
}

function volverAPaciente() {
  fase.value = 'paciente'
  error.value = ''
}

const sumario = computed(() => {
  if (!resumen.value.length) return null
  const completas = resumen.value.filter(r => r.completa).length
  const pendientes = resumen.value.length - completas
  return { completas, pendientes, total: resumen.value.length }
})
</script>

<template>
  <div class="min-h-screen" style="background: var(--paper)">

    <!-- Header -->
    <header class="border-b" style="border-color: var(--ink)">
      <div class="max-w-5xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
        <div>
          <p class="eyebrow" style="color: var(--muted)">Panel medico</p>
          <h1 class="font-display text-2xl lg:text-3xl mt-0.5" style="font-weight: 500">
            Registro de dosis
          </h1>
        </div>
        <div class="text-right">
          <p class="font-mono text-[11px] uppercase" style="color: var(--muted); letter-spacing: 0.1em">
            {{ nombreMedico || 'Medico' }}
          </p>
          <button type="button" class="text-xs mt-1 underline-offset-2 hover:underline" style="color: var(--muted)" @click="logout">
            Cerrar sesion ↗
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 lg:px-10 py-8 lg:py-12 space-y-8">

      <!-- FASE 1: SCAN -->
      <section v-if="fase === 'scan'" class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        <div>
          <p class="eyebrow" style="color: var(--muted)">Paso 1</p>
          <h2 class="font-display text-3xl lg:text-4xl mt-2" style="font-weight: 500">
            Escanea el <em class="italic" style="font-weight: 300">QR del paciente.</em>
          </h2>
          <p class="text-sm mt-3" style="color: var(--muted); max-width: 460px">
            Pidele al ciudadano que abra su cartilla digital y muestre su codigo QR personal.
            Tambien puedes registrar la CURP manualmente si no esta disponible.
          </p>

          <div class="mt-6 border-2 overflow-hidden bg-black aspect-[4/3] relative" style="border-color: var(--ink)">
            <QrcodeStream
              v-if="cameraSoportada && cameraEnabled"
              @detect="onScan"
              @error="onCameraError"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center p-6 text-center" style="background: var(--moss-dark); color: var(--paper)">
              <p class="eyebrow" style="opacity: 0.7">Sin camara</p>
              <p class="mt-2 text-sm" style="opacity: 0.85">
                No se pudo iniciar la camara. Usa la busqueda manual.
              </p>
            </div>
          </div>

          <button type="button" class="btn-ghost mt-4 text-sm" @click="fase = 'manual'">
            Buscar por CURP manualmente →
          </button>

          <div v-if="error" class="mt-4 flex items-start gap-2 px-3 py-2.5 border-l-2" style="border-color: var(--wine); background: rgba(153,27,27,0.04)">
            <p class="text-[13px]" style="color: var(--wine)">{{ error }}</p>
          </div>
        </div>

        <aside class="border p-6" style="border-color: var(--border); background: white">
          <p class="eyebrow" style="color: var(--muted)">Por que QR</p>
          <h3 class="font-display text-xl mt-2" style="font-weight: 500">
            Identificacion oficial
          </h3>
          <ul class="mt-4 space-y-3 text-sm" style="color: var(--ink2)">
            <li class="flex gap-3">
              <span class="font-mono text-xs" style="color: var(--moss)">01</span>
              <span>Cada paciente tiene un token unico que expira en minutos.</span>
            </li>
            <li class="flex gap-3">
              <span class="font-mono text-xs" style="color: var(--moss)">02</span>
              <span>La dosis queda firmada con tu CURP, hora y unidad asignada.</span>
            </li>
            <li class="flex gap-3">
              <span class="font-mono text-xs" style="color: var(--moss)">03</span>
              <span>El ciudadano ve la dosis en su cartilla en tiempo real.</span>
            </li>
          </ul>
        </aside>
      </section>

      <!-- FASE 2: MANUAL -->
      <section v-else-if="fase === 'manual'" class="max-w-md">
        <p class="eyebrow" style="color: var(--muted)">Busqueda manual</p>
        <h2 class="font-display text-3xl mt-2" style="font-weight: 500">
          CURP del paciente
        </h2>
        <p class="text-sm mt-3" style="color: var(--muted)">
          Si el QR no esta disponible, ingresa la CURP de 18 caracteres.
        </p>

        <input
          v-model="pacienteCurp"
          maxlength="18"
          class="field mono mt-5 uppercase tracking-wider"
          placeholder="XXXX000000XXXXXXXX"
          autocomplete="off"
          @input="pacienteCurp = pacienteCurp.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18)"
          @keyup.enter="buscarPorCurp"
        />

        <div v-if="error" class="mt-4 flex items-start gap-2 px-3 py-2.5 border-l-2" style="border-color: var(--wine); background: rgba(153,27,27,0.04)">
          <p class="text-[13px]" style="color: var(--wine)">{{ error }}</p>
        </div>

        <div class="mt-5 flex gap-3">
          <button type="button" class="btn-primary flex-1" :disabled="cargando" @click="buscarPorCurp">
            <span>{{ cargando ? 'Buscando…' : 'Continuar' }}</span>
            <span class="font-mono text-sm ml-2">→</span>
          </button>
          <button type="button" class="btn-ghost" @click="fase = 'scan'; error = ''">
            Volver al QR
          </button>
        </div>
      </section>

      <!-- FASE 3: PACIENTE -->
      <section v-else-if="fase === 'paciente' && paciente">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p class="eyebrow" style="color: var(--muted)">Paciente identificado</p>
            <h2 class="font-display text-3xl lg:text-4xl mt-2" style="font-weight: 500">
              {{ paciente.nombre }} {{ paciente.apellido_paterno }}
              <span v-if="paciente.apellido_materno"> {{ paciente.apellido_materno }}</span>
            </h2>
            <p class="font-mono text-xs mt-2" style="color: var(--muted); letter-spacing: 0.12em">
              {{ paciente.curp }}
            </p>
            <p v-if="paciente.unidad_nombre" class="text-sm mt-1" style="color: var(--muted)">
              {{ paciente.unidad_nombre }}
            </p>
          </div>
          <button type="button" class="btn-ghost text-xs" @click="nuevoPaciente">
            Cambiar paciente ↗
          </button>
        </div>

        <div v-if="sumario" class="mt-6 grid grid-cols-3 gap-6 max-w-md">
          <div>
            <p class="tabular font-display text-3xl" style="font-weight: 400">{{ sumario.completas }}</p>
            <p class="eyebrow mt-1" style="color: var(--muted)">Completas</p>
          </div>
          <div>
            <p class="tabular font-display text-3xl" :style="`color: ${sumario.pendientes > 0 ? 'var(--wine)' : 'var(--ink)'}; font-weight: 400`">
              {{ sumario.pendientes }}
            </p>
            <p class="eyebrow mt-1" style="color: var(--muted)">Pendientes</p>
          </div>
          <div>
            <p class="tabular font-display text-3xl" style="font-weight: 400">{{ sumario.total }}</p>
            <p class="eyebrow mt-1" style="color: var(--muted)">Vacunas</p>
          </div>
        </div>

        <div class="mt-10">
          <div class="border-b pb-2 mb-4 flex items-baseline justify-between gap-3" style="border-color: var(--ink)">
            <h3 class="font-display text-2xl" style="font-weight: 500">Aplicar dosis</h3>
            <p class="eyebrow" style="color: var(--muted)">Elige la vacuna</p>
          </div>

          <div v-if="resumen.length === 0" class="py-8 text-center">
            <p class="font-display text-lg italic" style="color: var(--muted); font-weight: 300">
              No hay vacunas registradas en su esquema todavia.
            </p>
            <button type="button" class="btn-primary mt-4" @click="abrirRegistro(catalogo[0]?.id || 0)">
              Registrar primera dosis →
            </button>
          </div>

          <div v-else class="divide-y" style="border-color: var(--border)">
            <button
              v-for="r in resumen"
              :key="r.vacuna_id"
              type="button"
              :disabled="r.completa"
              class="w-full text-left py-4 flex items-center justify-between gap-4 group transition-colors"
              :class="r.completa ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[rgba(14,80,55,0.04)]'"
              style="border-color: var(--border)"
              @click="!r.completa && abrirRegistro(r.vacuna_id)"
            >
              <div class="flex-1 min-w-0">
                <p style="font-weight: 500">{{ r.nombre }}</p>
                <p class="text-xs mt-0.5" style="color: var(--muted)">
                  {{ r.dosis_aplicadas }} de {{ r.dosis_total }} dosis
                </p>
              </div>
              <span v-if="r.completa" class="font-mono text-[10px] uppercase" style="color: var(--moss); letter-spacing: 0.08em">
                completa
              </span>
              <span v-else class="font-mono text-sm" style="color: var(--moss)">
                + dosis {{ Math.min(r.dosis_aplicadas + 1, r.dosis_total) }} →
              </span>
            </button>
          </div>
        </div>

        <div v-if="error" class="mt-4 flex items-start gap-2 px-3 py-2.5 border-l-2" style="border-color: var(--wine); background: rgba(153,27,27,0.04)">
          <p class="text-[13px]" style="color: var(--wine)">{{ error }}</p>
        </div>
      </section>

      <!-- FASE 4: REGISTRAR -->
      <section v-else-if="fase === 'registrar' && paciente" class="max-w-xl">
        <p class="eyebrow" style="color: var(--muted)">Registrar dosis</p>
        <h2 class="font-display text-3xl mt-2" style="font-weight: 500">
          {{ catalogo.find(c => c.id === form.vacuna_id)?.nombre }}
        </h2>
        <p class="text-sm mt-2" style="color: var(--muted)">
          Paciente: <span class="font-mono text-xs" style="letter-spacing: 0.12em">{{ paciente.curp }}</span> ·
          {{ paciente.nombre }} {{ paciente.apellido_paterno }}
        </p>

        <div class="mt-6 space-y-5">
          <label class="block">
            <span class="eyebrow">Numero de dosis</span>
            <input v-model.number="form.numero_dosis" type="number" min="1" max="20" class="field mt-2 max-w-[140px]" />
          </label>

          <label class="block">
            <span class="eyebrow">Lugar de aplicacion</span>
            <input v-model="form.lugar_aplicacion" type="text" class="field mt-2" placeholder="UMF, hospital o sitio de campania" maxlength="200" />
          </label>

          <label class="block">
            <span class="eyebrow">Lote (opcional)</span>
            <input v-model="form.lote" type="text" class="field mt-2 mono" placeholder="LOT-XXX-000" maxlength="60" />
          </label>

          <div class="border-t pt-4 text-xs font-mono" style="border-color: var(--border); color: var(--muted); letter-spacing: 0.06em">
            FECHA · {{ new Date().toLocaleDateString('es-MX') }}<br />
            HORA · {{ new Date().toLocaleTimeString('es-MX') }}<br />
            FIRMADO POR · {{ curpMedico }}
          </div>

          <div v-if="error" class="flex items-start gap-2 px-3 py-2.5 border-l-2" style="border-color: var(--wine); background: rgba(153,27,27,0.04)">
            <p class="text-[13px]" style="color: var(--wine)">{{ error }}</p>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" class="btn-primary flex-1" :disabled="cargando" @click="aplicarDosis">
              <span>{{ cargando ? 'Registrando…' : 'Aplicar dosis' }}</span>
              <span class="font-mono text-sm ml-2">→</span>
            </button>
            <button type="button" class="btn-ghost" @click="volverAPaciente">
              Cancelar
            </button>
          </div>
        </div>
      </section>

      <!-- FASE 5: EXITO -->
      <section v-else-if="fase === 'exito' && paciente && ultimaDosisAplicada" class="max-w-xl">
        <div class="border-l-4 pl-6 py-4" style="border-color: var(--moss)">
          <p class="eyebrow" style="color: var(--moss)">Dosis registrada</p>
          <h2 class="font-display text-3xl mt-2" style="font-weight: 500">
            {{ ultimaDosisAplicada.vacuna }}
            <span class="italic" style="font-weight: 300">dosis {{ ultimaDosisAplicada.numero }}.</span>
          </h2>
          <p class="text-sm mt-3" style="color: var(--muted)">
            La dosis quedo registrada en la cartilla de
            <span style="color: var(--ink); font-weight: 500">{{ paciente.nombre }} {{ paciente.apellido_paterno }}</span>
            con fecha y hora de hoy.
          </p>
        </div>

        <div class="mt-8 flex gap-3 flex-wrap">
          <button type="button" class="btn-primary" @click="volverAPaciente">
            Aplicar otra dosis al mismo paciente →
          </button>
          <button type="button" class="btn-ghost" @click="nuevoPaciente">
            Nuevo paciente
          </button>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.field.mono {
  font-family: var(--font-mono);
}
</style>
