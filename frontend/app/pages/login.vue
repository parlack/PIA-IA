<script setup lang="ts">
import { esRolAdmin, esRolMedico, esRolPrivilegiado, rutaPorRol, normalizarRolParaStorage } from '~/utils/rol'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Iniciar sesión' })

const router = useRouter()
const api = useApi()
const { t } = useI18n()

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
  if (!curp.value) { error.value = `${t('login.curp')}: ${t('login.invalidCurp')}`; return }
  if (!curpRegex.test(curp.value)) { error.value = t('login.invalidCurp'); return }
  if (tab.value === 'acceso' && !password.value.trim()) { error.value = t('login.password'); return }

  loading.value = true
  try {
    const data = await api.login(curp.value, tab.value === 'acceso' ? password.value : undefined) as {
      autenticado: boolean; curp: string; nombre: string; apellido_paterno: string; correo: string | null; rol: string
    }
    const rolNorm = normalizarRolParaStorage(data.rol)
    if (esRolPrivilegiado(rolNorm) && !data.autenticado) {
      error.value = esRolAdmin(rolNorm)
        ? 'Las cuentas administrativas requieren acceso completo con contrasena.'
        : 'Las cuentas medicas requieren acceso completo con contrasena.'
      tab.value = 'acceso'
      return
    }
    localStorage.setItem('auth', data.autenticado ? 'true' : 'false')
    localStorage.setItem('curp', data.curp)
    localStorage.setItem('rol', rolNorm)
    const display = [data.nombre, data.apellido_paterno].filter(Boolean).join(' ').trim()
    if (display) localStorage.setItem('userName', display)
    router.push(rutaPorRol(rolNorm))
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
  <div class="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">

    <!-- Video de fondo difuminado (solo mobile / tablet) -->
    <div class="absolute inset-0 lg:hidden z-0 overflow-hidden pointer-events-none">
      <video
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        class="absolute inset-0 w-full h-full object-cover"
        style="filter: blur(2px) brightness(0.55) saturate(0.95); transform: scale(1.05)"
      >
        <source src="/login-hero.webm" type="video/webm" />
      </video>
      <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(14,80,55,0.55) 0%, rgba(26,26,26,0.55) 100%)"></div>
    </div>

    <!-- Columna izquierda: identidad editorial -->
    <aside class="relative z-10 lg:w-[34%] lg:min-h-screen px-6 lg:px-12 pt-6 lg:pt-14 pb-6 lg:pb-14 flex flex-col lg:bg-[var(--moss-dark)] aside-deco" style="color: var(--paper)">

      <!-- Capa 1: textura de grano sutil (solo desktop) -->
      <div class="grain-layer hidden lg:block" aria-hidden="true"></div>

      <!-- Capa 2: glifo decorativo gigante (cruz medica editorial) -->
      <svg class="glyph-deco hidden lg:block" viewBox="0 0 200 200" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.18">
          <circle cx="100" cy="100" r="85" />
          <circle cx="100" cy="100" r="62" />
          <circle cx="100" cy="100" r="38" />
        </g>
        <g fill="currentColor" opacity="0.12">
          <rect x="92" y="55" width="16" height="90" />
          <rect x="55" y="92" width="90" height="16" />
        </g>
      </svg>

      <!-- Header compacto (siempre visible) -->
      <div class="relative flex items-center justify-between gap-3 z-10">
        <div class="flex items-center gap-3">
          <img src="/pia-logo.png" alt="PIA-IA" class="h-10 lg:h-12 w-auto" style="filter: brightness(0) invert(1)" />
          <div class="text-xs leading-tight" style="font-family: var(--font-mono); letter-spacing: 0.12em">
            <p class="opacity-70">PIA · IA</p>
            <p class="hidden sm:block">SECRETARIA DE SALUD</p>
          </div>
        </div>
        <div style="color: var(--paper); opacity: 0.85">
          <LanguageSwitcher />
        </div>
      </div>

      <!-- Linea decorativa con marcas tipo regla (solo desktop) -->
      <div class="ruler-line hidden lg:flex mt-8" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span>
      </div>

      <!-- Hero compacto en mobile, completo en desktop -->
      <div class="relative z-10 flex-1 flex flex-col justify-center py-6 lg:py-0">
        <p class="eyebrow mt-4 lg:mt-0" style="color: var(--moss-soft)">{{ t('login.eyebrow') }}</p>
        <h1 class="font-display mt-3 lg:mt-4 text-[28px] leading-[1.1] sm:text-[40px] lg:text-[60px] lg:leading-[1.05] tracking-tight" style="font-weight: 400">
          {{ t('login.title') }}
          <em class="italic lg:block" style="font-weight: 300">{{ t('login.titleItalic') }}</em>
        </h1>
        <p class="mt-3 lg:mt-6 text-sm max-w-md leading-relaxed opacity-80 hidden sm:block">
          {{ t('login.subtitle') }}
        </p>
      </div>

      <!-- Footer con sello -->
      <div class="relative z-10 hidden lg:flex items-end justify-between gap-4 mt-6 lg:mt-8">
        <div class="text-[11px] opacity-50" style="font-family: var(--font-mono); letter-spacing: 0.08em">
          © {{ anio }} — PIA-IA · MX
          <span class="opacity-50 mx-2">·</span>
          v2.4.1
        </div>

        <!-- Sello circular oficial -->
        <div class="seal-stamp" aria-hidden="true">
          <svg viewBox="0 0 100 100" class="seal-svg">
            <defs>
              <path id="sealCircle" d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
            </defs>
            <text font-family="var(--font-mono)" font-size="7.5" letter-spacing="2" fill="currentColor" opacity="0.7">
              <textPath href="#sealCircle" startOffset="0">
                · OFICIAL · SECRETARIA DE SALUD · MX · PIA-IA ·
              </textPath>
            </text>
            <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.4" />
            <text x="50" y="48" text-anchor="middle" font-family="var(--font-display)" font-size="14" font-style="italic" fill="currentColor" opacity="0.85">P</text>
            <text x="50" y="60" text-anchor="middle" font-family="var(--font-mono)" font-size="5" letter-spacing="1.5" fill="currentColor" opacity="0.55">VERIFICADO</text>
          </svg>
        </div>
      </div>
    </aside>

    <!-- Columna derecha: form + video -->
    <main class="relative z-10 flex-1 flex flex-col lg:flex-row lg:min-h-screen">
      <div class="lg:flex-1 flex items-start lg:items-center justify-center px-4 lg:px-12 py-6 lg:py-14 relative">

        <!-- Marca de paginacion editorial (solo desktop) -->
        <div class="hidden lg:flex page-mark">
          <span class="font-mono text-[11px] opacity-50" style="letter-spacing: 0.18em">P. 02</span>
          <span class="page-mark-line"></span>
          <span class="eyebrow" style="font-size: 10px">Identificacion</span>
        </div>

        <!-- Esquinas decorativas tipo crop marks (solo desktop) -->
        <span class="crop-mark crop-tl hidden lg:block" aria-hidden="true"></span>
        <span class="crop-mark crop-tr hidden lg:block" aria-hidden="true"></span>
        <span class="crop-mark crop-bl hidden lg:block" aria-hidden="true"></span>
        <span class="crop-mark crop-br hidden lg:block" aria-hidden="true"></span>

        <div class="w-full max-w-md mx-auto p-6 lg:p-0 rounded-lg lg:rounded-none login-card lg:!bg-transparent lg:!backdrop-blur-none">

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
            <span class="text-sm" style="font-weight: 500">{{ t('login.quickConsult') }}</span>
            <span v-if="tab === 'consulta'" class="absolute left-0 right-0 -bottom-px h-[2px]" style="background: var(--ink)" />
          </button>
          <button @click="switchTab('acceso')" class="pb-3 -mb-px relative transition-colors"
            :class="tab === 'acceso' ? '' : 'opacity-50 hover:opacity-80'">
            <span class="text-sm" style="font-weight: 500">{{ t('login.fullAccess') }}</span>
            <span v-if="tab === 'acceso'" class="absolute left-0 right-0 -bottom-px h-[2px]" style="background: var(--ink)" />
          </button>
        </div>

        <p class="mt-5 text-[13px] leading-relaxed" style="color: var(--muted)">
          {{ t('login.passwordHelp') }}
        </p>

        <div class="mt-7 space-y-5">

          <label class="block">
            <span class="eyebrow">{{ t('login.curp') }}</span>
            <input :value="curp" @input="onCurpInput" @keyup.enter="handleLogin" type="text" maxlength="18"
              placeholder="XXXX000000XXXXXXXX" autocomplete="off" spellcheck="false"
              class="field mono mt-2 uppercase" />
          </label>

          <label v-if="tab === 'acceso'" class="block">
            <span class="eyebrow">{{ t('login.password') }}</span>
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
            <span>{{ loading ? `${t('common.loading')}…` : (tab === 'consulta' ? t('login.quickConsult') : t('common.login')) }}</span>
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

        <!-- Pie editorial del formulario: tres marcas (legal · soporte · estado) -->
        <div class="hidden lg:grid form-foot mt-10">
          <div>
            <span class="eyebrow" style="font-size: 9px">Marco legal</span>
            <p class="text-[11px] mt-1" style="color: var(--muted)">LGS Art. 144 · LFPDPPP</p>
          </div>
          <div>
            <span class="eyebrow" style="font-size: 9px">Soporte</span>
            <p class="text-[11px] mt-1" style="color: var(--muted)">soporte@pia-ia.gob.mx</p>
          </div>
          <div>
            <span class="eyebrow" style="font-size: 9px">Estado</span>
            <p class="text-[11px] mt-1 flex items-center gap-1.5" style="color: var(--muted)">
              <span class="inline-block w-1.5 h-1.5 rounded-full" style="background: var(--moss)"></span>
              Operativo
            </p>
          </div>
        </div>

        </div>
      </div>

      <!-- Sub-columna video: solo desktop (en mobile el video va de fondo difuminado) -->
      <aside class="hidden lg:block lg:flex-1 relative overflow-hidden video-frame" style="background: #1a1a1a">
        <video
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          class="absolute inset-0 w-full h-full object-cover video-tinted"
        >
          <source src="/login-hero.webm" type="video/webm" />
        </video>
        <!-- Overlay con tinte verde notorio (moss) + blur sutil -->
        <div class="video-overlay" aria-hidden="true"></div>
        <!-- Glow verde radial sutil al centro para mas profundidad -->
        <div class="video-glow" aria-hidden="true"></div>
      </aside>
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

/* Card translucida en mobile sobre el video difuminado */
@media (max-width: 1023px) {
  .login-card {
    background: rgba(244, 239, 231, 0.72);
    backdrop-filter: blur(10px) saturate(1.1);
    -webkit-backdrop-filter: blur(10px) saturate(1.1);
    box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255, 255, 255, 0.12) inset;
    border: 1px solid rgba(255, 255, 255, 0.35);
  }
}

/* ===========================================================
   COLUMNA IZQUIERDA · DETALLES EDITORIALES
   =========================================================== */

.aside-deco {
  overflow: hidden;
}

/* Textura de grano sutil (SVG inline en filter) */
.grain-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 180px 180px;
  z-index: 0;
}

/* Glifo gigante decorativo (cruz medica + circulos concentricos) */
.glyph-deco {
  position: absolute;
  right: -120px;
  bottom: -120px;
  width: 520px;
  height: 520px;
  color: var(--moss-soft);
  z-index: 0;
  pointer-events: none;
  animation: glyph-rotate 90s linear infinite;
}
@keyframes glyph-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Linea de marcas tipo regla */
.ruler-line {
  align-items: flex-end;
  gap: 22px;
  height: 12px;
  opacity: 0.4;
}
.ruler-line span {
  display: block;
  width: 1px;
  background: var(--moss-soft);
  height: 6px;
}
.ruler-line span:nth-child(3n+1) { height: 12px; }
.ruler-line span:nth-child(2n)   { opacity: 0.6; }

/* Sello circular oficial */
.seal-stamp {
  width: 88px;
  height: 88px;
  color: var(--moss-soft);
  flex-shrink: 0;
  animation: seal-rotate 60s linear infinite;
}
.seal-svg {
  width: 100%;
  height: 100%;
  display: block;
}
@keyframes seal-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ===========================================================
   COLUMNA DERECHA · DETALLES EDITORIALES
   =========================================================== */

/* Marca de paginacion en la parte superior derecha del form */
.page-mark {
  position: absolute;
  top: 28px;
  left: 48px;
  align-items: center;
  gap: 12px;
}
.page-mark-line {
  display: block;
  width: 32px;
  height: 1px;
  background: var(--border);
}

/* Crop marks (esquinas tipo impresion editorial) */
.crop-mark {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
  opacity: 0.45;
}
.crop-mark::before,
.crop-mark::after {
  content: '';
  position: absolute;
  background: var(--border);
}
.crop-tl { top: 24px; left: 24px; }
.crop-tl::before { top: 0; left: 0; width: 12px; height: 1px; }
.crop-tl::after  { top: 0; left: 0; width: 1px; height: 12px; }
.crop-tr { top: 24px; right: 24px; }
.crop-tr::before { top: 0; right: 0; width: 12px; height: 1px; }
.crop-tr::after  { top: 0; right: 0; width: 1px; height: 12px; }
.crop-bl { bottom: 24px; left: 24px; }
.crop-bl::before { bottom: 0; left: 0; width: 12px; height: 1px; }
.crop-bl::after  { bottom: 0; left: 0; width: 1px; height: 12px; }
.crop-br { bottom: 24px; right: 24px; }
.crop-br::before { bottom: 0; right: 0; width: 12px; height: 1px; }
.crop-br::after  { bottom: 0; right: 0; width: 1px; height: 12px; }

/* Pie del form: tres columnas con marco legal, soporte, status */
.form-foot {
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px;
  padding-top: 20px;
  border-top: 1px dashed var(--border);
}

/* ===========================================================
   COLUMNA VIDEO DESKTOP · TINTE VERDE + BLUR
   =========================================================== */

.video-frame {
  position: relative;
}

/* Video con leve saturacion/contraste para asentar el tinte */
.video-tinted {
  filter: saturate(0.9) contrast(1.02) brightness(0.92);
}

/* Overlay principal: tinte verde notorio sobre el video */
.video-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg,
      rgba(14, 80, 55, 0.32) 0%,
      rgba(8, 46, 32, 0.42) 50%,
      rgba(14, 80, 55, 0.32) 100%
    );
  mix-blend-mode: multiply;
  backdrop-filter: blur(1.5px) saturate(1.1);
  -webkit-backdrop-filter: blur(1.5px) saturate(1.1);
}

/* Glow radial verde al centro para dar profundidad */
.video-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(14, 80, 55, 0.0) 0%,
    rgba(14, 80, 55, 0.18) 60%,
    rgba(8, 46, 32, 0.45) 100%
  );
}
</style>
