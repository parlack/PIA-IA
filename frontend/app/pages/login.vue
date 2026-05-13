<script setup lang="ts">
import { normalizarRolParaStorage } from '~/utils/rol'

definePageMeta({ layout: 'auth' })

const router = useRouter()
const api = useApi()

const tab = ref<'consulta' | 'acceso'>('consulta')

const curp = ref('')
const password = ref('')
const showPass = ref(false)
const error = ref('')
const loading = ref(false)

const showCurpHelper = ref(false)
const helperStep = ref<'form' | 'result'>('form')
const helperLoading = ref(false)

const helper = reactive({
  nombre: '', apellidoPaterno: '', apellidoMaterno: '',
  fechaNacimiento: '', sexo: '' as 'H' | 'M' | '', estadoNacimiento: '',
})
const helperErrors = reactive({
  nombre: '', apellidoPaterno: '', apellidoMaterno: '',
  fechaNacimiento: '', sexo: '', estadoNacimiento: '',
})

const curpGenerada = ref('')
const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/

const estadosCodes: Record<string, string> = {
  'Aguascalientes': 'AS', 'Baja California': 'BC', 'Baja California Sur': 'BS',
  'Campeche': 'CC', 'Chiapas': 'CS', 'Chihuahua': 'CH', 'Ciudad de Mexico': 'DF',
  'Coahuila': 'CL', 'Colima': 'CM', 'Durango': 'DG', 'Guanajuato': 'GT',
  'Guerrero': 'GR', 'Hidalgo': 'HG', 'Jalisco': 'JC', 'Estado de Mexico': 'MC',
  'Michoacan': 'MN', 'Morelos': 'MO', 'Nayarit': 'NT', 'Nuevo Leon': 'NL',
  'Oaxaca': 'OC', 'Puebla': 'PL', 'Queretaro': 'QT', 'Quintana Roo': 'QR',
  'San Luis Potosi': 'SP', 'Sinaloa': 'SL', 'Sonora': 'SR', 'Tabasco': 'TC',
  'Tamaulipas': 'TS', 'Tlaxcala': 'TL', 'Veracruz': 'VZ', 'Yucatan': 'YN',
  'Zacatecas': 'ZS',
}
const estados = Object.keys(estadosCodes)

function formatCurp(val: string) {
  return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18)
}
function onCurpInput(e: Event) {
  curp.value = formatCurp((e.target as HTMLInputElement).value)
}
function switchTab(t: 'consulta' | 'acceso') {
  tab.value = t
  error.value = ''
  if (t === 'consulta') password.value = ''
}

function generarCurpAproximada(): string {
  const n = helper.nombre.toUpperCase().replace(/[^A-Z]/g, '')
  const ap = helper.apellidoPaterno.toUpperCase().replace(/[^A-Z]/g, '')
  const am = helper.apellidoMaterno.toUpperCase().replace(/[^A-Z]/g, '')
  const fecha = helper.fechaNacimiento.replace(/-/g, '').slice(2)
  const sexo = helper.sexo
  const estado = estadosCodes[helper.estadoNacimiento] || 'NL'
  const vocalAp = ap.slice(1).split('').find(c => 'AEIOU'.includes(c)) || 'X'
  const part1 = (ap[0] || 'X') + vocalAp + (am[0] || 'X') + (n[0] || 'X')
  const part2 = fecha + sexo + estado
  const cAp = ap.slice(1).split('').filter(c => !'AEIOU'.includes(c))
  const cAm = am.slice(1).split('').filter(c => !'AEIOU'.includes(c))
  const cN = n.slice(1).split('').filter(c => !'AEIOU'.includes(c))
  const part3 = (cAp[0] || 'X') + (cAm[0] || 'X') + (cN[0] || 'X')
  return (part1 + part2 + part3 + '0A').toUpperCase()
}

function validateHelper(): boolean {
  let ok = true
  helperErrors.nombre = helper.nombre.trim() ? '' : 'Requerido'
  helperErrors.apellidoPaterno = helper.apellidoPaterno.trim() ? '' : 'Requerido'
  helperErrors.apellidoMaterno = helper.apellidoMaterno.trim() ? '' : 'Requerido'
  helperErrors.fechaNacimiento = helper.fechaNacimiento ? '' : 'Requerido'
  helperErrors.sexo = helper.sexo ? '' : 'Requerido'
  helperErrors.estadoNacimiento = helper.estadoNacimiento ? '' : 'Requerido'
  Object.values(helperErrors).forEach(e => { if (e) ok = false })
  return ok
}

async function buscarCurp() {
  if (!validateHelper()) return
  helperLoading.value = true
  await new Promise(r => setTimeout(r, 1500))
  curpGenerada.value = generarCurpAproximada()
  helperLoading.value = false
  helperStep.value = 'result'
}

function usarCurpGenerada() {
  curp.value = curpGenerada.value
  showCurpHelper.value = false
  helperStep.value = 'form'
}

function resetHelper() {
  helperStep.value = 'form'
  curpGenerada.value = ''
  Object.assign(helper, { nombre: '', apellidoPaterno: '', apellidoMaterno: '', fechaNacimiento: '', sexo: '', estadoNacimiento: '' })
  Object.keys(helperErrors).forEach(k => (helperErrors as any)[k] = '')
}

async function handleLogin() {
  error.value = ''
  if (!curp.value) { error.value = 'Ingresa tu CURP.'; return }
  if (!curpRegex.test(curp.value)) { error.value = 'Formato de CURP invalido.'; return }
  if (tab.value === 'acceso' && !password.value.trim()) { error.value = 'Ingresa tu contrasena.'; return }

  loading.value = true
  try {
    const data = await api.login(curp.value, tab.value === 'acceso' ? password.value : undefined) as {
      autenticado: boolean; curp: string; nombre: string; apellido_paterno: string; correo: string | null; rol: string
    }
    localStorage.setItem('auth', data.autenticado ? 'true' : 'false')
    localStorage.setItem('curp', data.curp)
    localStorage.setItem('rol', normalizarRolParaStorage(data.rol))
    const display = [data.nombre, data.apellido_paterno].filter(Boolean).join(' ').trim()
    if (display) localStorage.setItem('userName', display)
    router.push('/dashboard')
  } catch (e: unknown) {
    const errData = (e as { data?: Record<string, unknown> })?.data
    if (errData?.registrable) {
      localStorage.setItem('auth', 'false')
      localStorage.setItem('curp', curp.value)
      localStorage.setItem('rol', 'usuario')
      localStorage.setItem('noRegistrado', 'true')
      router.push('/dashboard')
      return
    }
    error.value = e instanceof Error ? e.message : 'No se pudo iniciar sesion.'
  } finally { loading.value = false }
}

const anio = new Date().getFullYear()
</script>

<template>
  <div class="min-h-screen flex flex-col lg:flex-row">

    <!-- Columna izquierda: identidad editorial -->
    <aside class="lg:w-[44%] lg:min-h-screen px-6 lg:px-14 pt-8 lg:pt-14 pb-6 lg:pb-14 flex flex-col" style="background: var(--moss-dark); color: var(--paper)">
      <div class="flex items-center gap-3">
        <img src="/pia-logo.png" alt="PIA-IA" class="h-12 w-auto" style="filter: brightness(0) invert(1)" />
        <div class="text-xs leading-tight" style="font-family: var(--font-mono); letter-spacing: 0.12em">
          <p class="opacity-70">PIA · IA</p>
          <p>SECRETARIA DE SALUD</p>
        </div>
      </div>

      <div class="flex-1 flex flex-col justify-center py-10 lg:py-0">
        <p class="eyebrow" style="color: var(--moss-soft)">Sistema Nacional de Inmunizacion</p>
        <h1 class="font-display mt-4 text-[40px] leading-[1.05] sm:text-[52px] lg:text-[60px] tracking-tight" style="font-weight: 400">
          Tu cartilla<br />
          <em class="italic" style="font-weight: 300">de vacunacion,</em><br />
          siempre contigo.
        </h1>
        <p class="mt-6 text-sm max-w-md leading-relaxed opacity-80">
          Consulta tu historial completo, recibe recordatorios oficiales y descarga tu cartilla en cualquier momento.
        </p>

        <div class="mt-10 grid grid-cols-3 gap-6 max-w-md">
          <div>
            <p class="tabular font-display text-3xl" style="font-weight: 400">17</p>
            <p class="eyebrow mt-1" style="color: var(--moss-soft); font-size: 10px">Vacunas oficiales</p>
          </div>
          <div>
            <p class="tabular font-display text-3xl" style="font-weight: 400">32</p>
            <p class="eyebrow mt-1" style="color: var(--moss-soft); font-size: 10px">Entidades</p>
          </div>
          <div>
            <p class="tabular font-display text-3xl" style="font-weight: 400">24/7</p>
            <p class="eyebrow mt-1" style="color: var(--moss-soft); font-size: 10px">Disponible</p>
          </div>
        </div>
      </div>

      <div class="text-[11px] opacity-50 mt-8" style="font-family: var(--font-mono); letter-spacing: 0.08em">
        © {{ anio }} — PIA-IA · MX
      </div>
    </aside>

    <!-- Columna derecha: form -->
    <main class="flex-1 flex items-start lg:items-center px-6 lg:px-14 py-10 lg:py-14">
      <div class="w-full max-w-md mx-auto lg:mx-0">

        <p class="eyebrow">Acceso ciudadano</p>
        <h2 class="font-display mt-3 text-3xl sm:text-[34px] tracking-tight" style="font-weight: 500">
          Identificate
        </h2>
        <p class="mt-2 text-sm" style="color: var(--muted)">
          Selecciona como deseas continuar.
        </p>

        <!-- Tabs editoriales (sin pill ni shadow) -->
        <div class="mt-7 flex gap-6 border-b" style="border-color: var(--border)">
          <button @click="switchTab('consulta')" class="pb-3 -mb-px relative transition-colors"
            :class="tab === 'consulta' ? '' : 'opacity-50 hover:opacity-80'">
            <span class="text-sm" style="font-weight: 500">Consulta rapida</span>
            <span v-if="tab === 'consulta'" class="absolute left-0 right-0 -bottom-px h-[2px]" style="background: var(--ink)" />
          </button>
          <button @click="switchTab('acceso')" class="pb-3 -mb-px relative transition-colors"
            :class="tab === 'acceso' ? '' : 'opacity-50 hover:opacity-80'">
            <span class="text-sm" style="font-weight: 500">Acceso completo</span>
            <span v-if="tab === 'acceso'" class="absolute left-0 right-0 -bottom-px h-[2px]" style="background: var(--ink)" />
          </button>
        </div>

        <p class="mt-5 text-[13px] leading-relaxed" style="color: var(--muted)">
          <template v-if="tab === 'consulta'">
            Solo necesitas tu CURP. Ideal para consultar tu historial sin recordar contrasenas.
          </template>
          <template v-else>
            Ingresa con CURP y contrasena para gestionar tu expediente completo y recibir mensajes.
          </template>
        </p>

        <div class="mt-7 space-y-5">

          <label class="block">
            <span class="eyebrow">CURP</span>
            <input :value="curp" @input="onCurpInput" @keyup.enter="handleLogin" type="text" maxlength="18"
              placeholder="XXXX000000XXXXXXXX" autocomplete="off" spellcheck="false"
              class="field mono mt-2 uppercase" />
          </label>

          <label v-if="tab === 'acceso'" class="block">
            <span class="eyebrow">Contrasena</span>
            <div class="relative mt-2">
              <input v-model="password" :type="showPass ? 'text' : 'password'" @keyup.enter="handleLogin"
                placeholder="••••••••"
                class="field pr-12" />
              <button @click="showPass = !showPass" type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100 transition-opacity"
                style="color: var(--muted)">
                {{ showPass ? 'ocultar' : 'ver' }}
              </button>
            </div>
          </label>

          <div v-if="error" class="flex items-start gap-2 px-3 py-2.5 border-l-2" style="border-color: var(--wine); background: rgba(153,27,27,0.04)">
            <p class="text-[13px]" style="color: var(--wine)">{{ error }}</p>
          </div>

          <button :disabled="loading" @click="handleLogin" class="btn-primary w-full mt-2 flex items-center justify-center gap-2">
            <span v-if="loading" class="inline-block w-3.5 h-3.5 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
            <span>{{ loading ? 'Verificando…' : (tab === 'consulta' ? 'Ver mi cartilla' : 'Iniciar sesion') }}</span>
            <span v-if="!loading" class="font-mono text-sm">→</span>
          </button>
        </div>

        <!-- Acordeon: no conozco mi CURP -->
        <div class="mt-10">
          <button @click="showCurpHelper = !showCurpHelper; if (!showCurpHelper) resetHelper()"
            class="w-full flex items-center justify-between py-3 border-t border-b transition-colors" style="border-color: var(--border)">
            <span class="eyebrow">No conozco mi CURP</span>
            <span class="font-mono text-sm transition-transform" :class="showCurpHelper ? 'rotate-90' : ''">+</span>
          </button>

          <transition name="collapse">
            <div v-if="showCurpHelper" class="overflow-hidden">
              <div v-if="helperStep === 'form'" class="py-5 space-y-3">
                <input v-model="helper.nombre" type="text" placeholder="Nombre(s)" class="field"
                  :class="helperErrors.nombre ? 'field-error' : ''" />
                <div class="grid grid-cols-2 gap-2">
                  <input v-model="helper.apellidoPaterno" type="text" placeholder="Ap. paterno" class="field"
                    :class="helperErrors.apellidoPaterno ? 'field-error' : ''" />
                  <input v-model="helper.apellidoMaterno" type="text" placeholder="Ap. materno" class="field"
                    :class="helperErrors.apellidoMaterno ? 'field-error' : ''" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <input v-model="helper.fechaNacimiento" type="date" class="field"
                    :class="helperErrors.fechaNacimiento ? 'field-error' : ''" />
                  <div class="flex gap-2">
                    <button @click="helper.sexo = 'H'" type="button" class="flex-1 py-2.5 text-sm transition-colors border" :class="helper.sexo === 'H' ? 'text-white' : ''"
                      :style="helper.sexo === 'H' ? 'background: var(--ink); border-color: var(--ink)' : 'border-color: var(--border); color: var(--muted)'">Hombre</button>
                    <button @click="helper.sexo = 'M'" type="button" class="flex-1 py-2.5 text-sm transition-colors border" :class="helper.sexo === 'M' ? 'text-white' : ''"
                      :style="helper.sexo === 'M' ? 'background: var(--ink); border-color: var(--ink)' : 'border-color: var(--border); color: var(--muted)'">Mujer</button>
                  </div>
                </div>
                <select v-model="helper.estadoNacimiento" class="field"
                  :class="helperErrors.estadoNacimiento ? 'field-error' : ''">
                  <option value="" disabled>Estado de nacimiento…</option>
                  <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
                </select>

                <button @click="buscarCurp" :disabled="helperLoading" class="btn-ghost w-full mt-3 flex items-center justify-center gap-2">
                  <span v-if="helperLoading" class="inline-block w-3 h-3 border-[1.5px] rounded-full animate-spin" style="border-color: var(--ink); border-top-color: transparent" />
                  <span>{{ helperLoading ? 'Generando…' : 'Calcular mi CURP' }}</span>
                </button>
              </div>

              <div v-else class="py-5 space-y-4">
                <div class="text-center py-6 border" style="border-color: var(--border); background: var(--paper)">
                  <p class="eyebrow">CURP aproximada</p>
                  <p class="mt-3 font-mono text-xl tracking-[0.18em]" style="font-weight: 500">{{ curpGenerada }}</p>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button @click="usarCurpGenerada" class="btn-primary py-2.5 text-sm">Usar esta CURP</button>
                  <button @click="resetHelper" class="btn-ghost py-2.5 text-sm">Volver a llenar</button>
                </div>
                <p class="text-[11px] text-center" style="color: var(--muted); font-style: italic">
                  Verifica tu CURP oficial en gob.mx/curp.
                </p>
              </div>
            </div>
          </transition>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.field-error {
  border-color: var(--wine) !important;
}
.collapse-enter-active, .collapse-leave-active {
  transition: max-height 0.35s ease, opacity 0.25s;
  max-height: 800px;
}
.collapse-enter-from, .collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
