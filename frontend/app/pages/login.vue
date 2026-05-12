<script setup lang="ts">
import { normalizarRolParaStorage } from '~/utils/rol'

definePageMeta({ layout: 'auth' })

const router = useRouter()
const api = useApi()

const curp = ref('')
const password = ref('')
const showPass = ref(false)
const error = ref('')
const loading = ref(false)

// Panel "Desconozco mi CURP"
const showCurpHelper = ref(false)
const helperStep = ref<'form' | 'result'>('form')
const helperLoading = ref(false)

const helper = reactive({
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  sexo: '' as 'H' | 'M' | '',
  estadoNacimiento: '',
})

const helperErrors = reactive({
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  sexo: '',
  estadoNacimiento: '',
})

const curpGenerada = ref('')

const estadosCodes: Record<string, string> = {
  'Aguascalientes': 'AS', 'Baja California': 'BC', 'Baja California Sur': 'BS',
  'Campeche': 'CC', 'Chiapas': 'CS', 'Chihuahua': 'CH', 'Ciudad de México': 'DF',
  'Coahuila': 'CL', 'Colima': 'CM', 'Durango': 'DG', 'Guanajuato': 'GT',
  'Guerrero': 'GR', 'Hidalgo': 'HG', 'Jalisco': 'JC', 'Estado de México': 'MC',
  'Michoacán': 'MN', 'Morelos': 'MO', 'Nayarit': 'NT', 'Nuevo León': 'NL',
  'Oaxaca': 'OC', 'Puebla': 'PL', 'Querétaro': 'QT', 'Quintana Roo': 'QR',
  'San Luis Potosí': 'SP', 'Sinaloa': 'SL', 'Sonora': 'SR', 'Tabasco': 'TC',
  'Tamaulipas': 'TS', 'Tlaxcala': 'TL', 'Veracruz': 'VZ', 'Yucatán': 'YN',
  'Zacatecas': 'ZS',
}

const estados = Object.keys(estadosCodes)

// Genera CURP simplificada (aproximación visual, no oficial)
function generarCurpAproximada(): string {
  const n = helper.nombre.toUpperCase().replace(/[^A-Z]/g, '')
  const ap = helper.apellidoPaterno.toUpperCase().replace(/[^A-Z]/g, '')
  const am = helper.apellidoMaterno.toUpperCase().replace(/[^A-Z]/g, '')
  const fecha = helper.fechaNacimiento.replace(/-/g, '').slice(2)
  const sexo = helper.sexo
  const estado = estadosCodes[helper.estadoNacimiento] || 'NL'

  // Primer letra + primera vocal interna del apellido paterno
  const vocalAp = ap.slice(1).split('').find(c => 'AEIOU'.includes(c)) || 'X'
  const part1 = (ap[0] || 'X') + vocalAp + (am[0] || 'X') + (n[0] || 'X')
  const part2 = fecha + sexo + estado
  const consonantesAp = ap.slice(1).split('').filter(c => !'AEIOU'.includes(c))
  const consonantesAm = am.slice(1).split('').filter(c => !'AEIOU'.includes(c))
  const consonantesN = n.slice(1).split('').filter(c => !'AEIOU'.includes(c))
  const part3 = (consonantesAp[0] || 'X') + (consonantesAm[0] || 'X') + (consonantesN[0] || 'X')
  return (part1 + part2 + part3 + '0A').toUpperCase()
}

function validateHelper(): boolean {
  let valid = true
  helperErrors.nombre = helper.nombre.trim() ? '' : 'Campo requerido.'
  helperErrors.apellidoPaterno = helper.apellidoPaterno.trim() ? '' : 'Campo requerido.'
  helperErrors.apellidoMaterno = helper.apellidoMaterno.trim() ? '' : 'Campo requerido.'
  helperErrors.fechaNacimiento = helper.fechaNacimiento ? '' : 'Campo requerido.'
  helperErrors.sexo = helper.sexo ? '' : 'Selecciona una opción.'
  helperErrors.estadoNacimiento = helper.estadoNacimiento ? '' : 'Selecciona un estado.'
  Object.values(helperErrors).forEach(e => { if (e) valid = false })
  return valid
}

async function buscarCurp() {
  if (!validateHelper()) return
  helperLoading.value = true
  await new Promise(r => setTimeout(r, 1800))
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
  helper.nombre = ''
  helper.apellidoPaterno = ''
  helper.apellidoMaterno = ''
  helper.fechaNacimiento = ''
  helper.sexo = ''
  helper.estadoNacimiento = ''
  Object.keys(helperErrors).forEach(k => (helperErrors as any)[k] = '')
}

// Login
const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/

function formatCurp(val: string) {
  return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18)
}

function onCurpInput(e: Event) {
  curp.value = formatCurp((e.target as HTMLInputElement).value)
}

async function handleLogin() {
  error.value = ''
  if (!curp.value) { error.value = 'Por favor ingresa tu CURP.'; return }
  if (!curpRegex.test(curp.value)) { error.value = 'El formato de CURP no es válido. Verifica e intenta de nuevo.'; return }

  loading.value = true
  try {
    const data = await api.login(
      curp.value,
      password.value.trim() ? password.value : undefined
    ) as {
      autenticado: boolean
      curp: string
      nombre: string
      apellido_paterno: string
      correo: string | null
      rol: string
    }
    localStorage.setItem('auth', data.autenticado ? 'true' : 'false')
    localStorage.setItem('curp', data.curp)
    localStorage.setItem('rol', normalizarRolParaStorage(data.rol))
    const display = [data.nombre, data.apellido_paterno].filter(Boolean).join(' ').trim()
    if (display) localStorage.setItem('userName', display)
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col">

    <!-- Top bar -->
    <div class="bg-black text-white py-2 px-6">
      <p class="text-xs text-center tracking-widest uppercase font-medium">
        Instituto Mexicano del Seguro Social — Sistema de Cartilla de Vacunación
      </p>
    </div>

    <!-- Contenido -->
    <div class="flex-1 flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-md">

        <!-- Header -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 border-2 border-black mb-6">
            <svg class="w-9 h-9" viewBox="0 0 40 40" fill="none">
              <rect x="1" y="1" width="38" height="38" stroke="black" stroke-width="2"/>
              <path d="M20 8v24M8 20h24" stroke="black" stroke-width="2.5"/>
              <circle cx="20" cy="20" r="5" fill="black"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black tracking-tight text-black uppercase">Cartilla de Vacunación</h1>
          <p class="text-sm text-gray-500 mt-1 font-medium">Acceso al Sistema Nacional de Inmunización</p>
        </div>

        <!-- Card principal -->
        <div class="border border-gray-200 bg-white p-8">
          <div class="mb-6">
            <h2 class="text-sm font-bold uppercase tracking-widest text-black mb-1">Identificación del Ciudadano</h2>
            <p class="text-xs text-gray-400">Ingresa tu CURP para acceder a tu expediente de vacunación.</p>
          </div>

          <div class="space-y-5">

            <!-- CURP -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">CURP</label>
              <input
                :value="curp" @input="onCurpInput" @keyup.enter="handleLogin"
                type="text" maxlength="18" placeholder="XXXX000000XXXXXXXX"
                autocomplete="off" spellcheck="false"
                class="w-full border border-gray-300 px-4 py-3 text-sm font-mono tracking-widest uppercase text-black placeholder-gray-300 focus:outline-none focus:border-black transition-colors"
              />
              <p class="text-xs text-gray-400 mt-1.5">18 caracteres · Ejemplo: GARM850101HDFRRS04</p>
            </div>

            <!-- Contraseña (opcional) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Contraseña
                  <span class="ml-1.5 text-gray-300 font-medium normal-case tracking-normal">(opcional)</span>
                </label>
              </div>
              <div class="relative">
                <input
                  v-model="password" :type="showPass ? 'text' : 'password'"
                  @keyup.enter="handleLogin"
                  placeholder="Ingresa tu contraseña"
                  class="w-full border border-gray-300 px-4 py-3 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-black transition-colors pr-11"
                />
                <button @click="showPass = !showPass" type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                  <svg v-if="!showPass" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                </button>
              </div>

              <!-- Aviso de acceso según contraseña -->
              <transition name="fade-info">
                <div v-if="!password"
                  class="mt-2 flex items-start gap-2 bg-gray-50 border border-gray-100 px-3 py-2.5">
                  <svg class="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-xs text-gray-400 leading-relaxed">
                    Sin contraseña verás un <span class="font-semibold text-gray-600">historial básico</span> de vacunas. Para acceso completo ingresa tu contraseña.
                  </p>
                </div>
                <div v-else
                  class="mt-2 flex items-start gap-2 bg-black px-3 py-2.5">
                  <svg class="w-3.5 h-3.5 text-white mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <p class="text-xs text-white leading-relaxed">
                    Acceso <span class="font-bold">completo</span> a tu expediente de vacunación.
                  </p>
                </div>
              </transition>
            </div>

            <!-- Error -->
            <div v-if="error" class="border border-gray-400 bg-gray-50 px-4 py-3 flex items-start gap-2.5">
              <svg class="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <p class="text-xs text-gray-700">{{ error }}</p>
            </div>

            <!-- Botón -->
            <button :disabled="loading" @click="handleLogin"
              class="w-full bg-black text-white py-3.5 text-sm font-bold uppercase tracking-widest transition-opacity disabled:opacity-50 hover:opacity-80 flex items-center justify-center gap-2">
              <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"/>
                <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
              </svg>
              <span>{{ loading ? 'Verificando…' : 'Consultar Expediente' }}</span>
            </button>

          </div>
        </div>

        <!-- Desconozco mi CURP -->
        <div class="mt-4 border border-gray-200 bg-white overflow-hidden">
          <button
            @click="showCurpHelper = !showCurpHelper; if (!showCurpHelper) resetHelper()"
            class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div class="flex items-center gap-3">
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-xs font-bold uppercase tracking-widest text-gray-600">Desconozco cuál es mi CURP</span>
            </div>
            <svg class="w-4 h-4 text-gray-400 transition-transform duration-300"
              :class="showCurpHelper ? 'rotate-180' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Panel colapsable -->
          <transition name="collapse">
            <div v-if="showCurpHelper" class="border-t border-gray-100">

              <!-- Paso: formulario -->
              <div v-if="helperStep === 'form'" class="px-5 py-5 space-y-4">
                <p class="text-xs text-gray-500 leading-relaxed">
                  Ingresa tus datos personales y construiremos tu CURP aproximada para que puedas consultarla o verificarla en RENAPO.
                </p>

                <div class="grid grid-cols-2 gap-3">
                  <div class="col-span-2">
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Nombre(s)</label>
                    <input v-model="helper.nombre" type="text" placeholder="Ej. Laura"
                      class="w-full border px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                      :class="helperErrors.nombre ? 'border-red-300' : 'border-gray-200'"/>
                    <p v-if="helperErrors.nombre" class="text-xs text-red-400 mt-1">{{ helperErrors.nombre }}</p>
                  </div>

                  <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Apellido paterno</label>
                    <input v-model="helper.apellidoPaterno" type="text" placeholder="Ej. Martínez"
                      class="w-full border px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                      :class="helperErrors.apellidoPaterno ? 'border-red-300' : 'border-gray-200'"/>
                    <p v-if="helperErrors.apellidoPaterno" class="text-xs text-red-400 mt-1">{{ helperErrors.apellidoPaterno }}</p>
                  </div>

                  <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Apellido materno</label>
                    <input v-model="helper.apellidoMaterno" type="text" placeholder="Ej. Gómez"
                      class="w-full border px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                      :class="helperErrors.apellidoMaterno ? 'border-red-300' : 'border-gray-200'"/>
                    <p v-if="helperErrors.apellidoMaterno" class="text-xs text-red-400 mt-1">{{ helperErrors.apellidoMaterno }}</p>
                  </div>

                  <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Fecha de nacimiento</label>
                    <input v-model="helper.fechaNacimiento" type="date"
                      class="w-full border px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                      :class="helperErrors.fechaNacimiento ? 'border-red-300' : 'border-gray-200'"/>
                    <p v-if="helperErrors.fechaNacimiento" class="text-xs text-red-400 mt-1">{{ helperErrors.fechaNacimiento }}</p>
                  </div>

                  <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Sexo de nacimiento</label>
                    <div class="flex gap-2 mt-0.5">
                      <button @click="helper.sexo = 'H'" type="button"
                        :class="helper.sexo === 'H' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'"
                        class="flex-1 border py-2.5 text-xs font-bold uppercase tracking-widest transition-colors">
                        Hombre
                      </button>
                      <button @click="helper.sexo = 'M'" type="button"
                        :class="helper.sexo === 'M' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'"
                        class="flex-1 border py-2.5 text-xs font-bold uppercase tracking-widest transition-colors">
                        Mujer
                      </button>
                    </div>
                    <p v-if="helperErrors.sexo" class="text-xs text-red-400 mt-1">{{ helperErrors.sexo }}</p>
                  </div>

                  <div class="col-span-2">
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Estado de nacimiento</label>
                    <select v-model="helper.estadoNacimiento"
                      class="w-full border px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors bg-white"
                      :class="helperErrors.estadoNacimiento ? 'border-red-300' : 'border-gray-200'">
                      <option value="" disabled>Selecciona un estado…</option>
                      <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
                    </select>
                    <p v-if="helperErrors.estadoNacimiento" class="text-xs text-red-400 mt-1">{{ helperErrors.estadoNacimiento }}</p>
                  </div>
                </div>

                <button @click="buscarCurp" :disabled="helperLoading"
                  class="w-full border border-black text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <svg v-if="helperLoading" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                  <span>{{ helperLoading ? 'Construyendo CURP…' : 'Obtener CURP aproximada' }}</span>
                </button>
              </div>

              <!-- Paso: resultado -->
              <div v-else-if="helperStep === 'result'" class="px-5 py-5 space-y-4">
                <div class="bg-gray-50 border border-gray-100 px-4 py-4">
                  <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">CURP aproximada</p>
                  <p class="text-xl font-black font-mono tracking-widest text-black">{{ curpGenerada }}</p>
                  <p class="text-xs text-gray-400 mt-2 leading-relaxed">
                    Este resultado es orientativo. Verifica y obtén tu CURP oficial en
                    <a href="https://www.gob.mx/curp" target="_blank" class="text-black font-semibold underline underline-offset-2">gob.mx/curp</a>.
                  </p>
                </div>

                <div class="flex gap-2">
                  <button @click="usarCurpGenerada"
                    class="flex-1 bg-black text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">
                    Usar esta CURP
                  </button>
                  <button @click="resetHelper"
                    class="flex-1 border border-gray-200 text-gray-500 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors">
                    Corregir datos
                  </button>
                </div>
              </div>

            </div>
          </transition>
        </div>

        <!-- Footer -->
        <div class="mt-6 text-center space-y-1">
          <p class="text-xs text-gray-400">
            ¿Problemas con tu CURP?
            <a href="#" class="text-black underline underline-offset-2 font-medium">Consulta RENAPO</a>
          </p>
          <p class="text-xs text-gray-300 mt-3">IMSS · Uso exclusivo para trámites oficiales de salud</p>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-gray-100 py-3 px-6">
      <p class="text-xs text-gray-300 text-center">
        © {{ new Date().getFullYear() }} Instituto Mexicano del Seguro Social · Todos los derechos reservados
      </p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

.fade-info-enter-active, .fade-info-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-info-enter-from, .fade-info-leave-to { opacity: 0; transform: translateY(-4px); }

.collapse-enter-active, .collapse-leave-active { transition: opacity 0.25s, max-height 0.35s ease; max-height: 600px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { opacity: 0; max-height: 0; }
</style>