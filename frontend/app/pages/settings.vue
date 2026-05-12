<script setup lang="ts">
const router = useRouter()
const api = useApi()

const sessionAuth = ref(false)
const sessionBasic = ref(false)

const loadPerfil = ref(true)
const loadError = ref('')

const saved = ref(false)
const savingSection = ref('')
const showModal = ref(false)
const currentStep = ref(0)
const analyzing = ref(false)
const transitioning = ref(false)

const unidadesList = ref<{ id: number; nombre: string; telefono?: string | null }[]>([])

onMounted(async () => {
  sessionAuth.value = localStorage.getItem('auth') === 'true'
  sessionBasic.value = localStorage.getItem('auth') === 'false' && !!localStorage.getItem('curp')
  const curp = localStorage.getItem('curp')
  if (!curp) {
    loadPerfil.value = false
    return
  }
  perfil.curp = curp
  try {
    const u = await api.getUsuario(curp) as {
      nombre: string
      apellido_paterno: string | null
      apellido_materno: string | null
      nss: string | null
      celular: string | null
      correo: string | null
      unidad_nombre: string | null
      ciudad: string | null
    }
    perfil.nombre = [u.nombre, u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ').trim()
    perfil.nss = u.nss || ''
    perfil.telefono = u.celular || ''
    perfil.email = u.correo || ''
    perfil.unidad = [u.unidad_nombre, u.ciudad].filter(Boolean).join(' — ') || (u.unidad_nombre || '—')
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'No se pudo cargar el perfil.'
  } finally {
    loadPerfil.value = false
  }
  try {
    unidadesList.value = (await api.getUnidades()) as { id: number; nombre: string; telefono?: string | null }[]
  } catch {
    unidadesList.value = []
  }
})

// Step 1 — INE/Pasaporte
const docFile = ref<File | null>(null)
const docPreview = ref<string | null>(null)
const docError = ref('')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    docError.value = 'Solo se aceptan imágenes (JPG, PNG, WEBP).'
    return
  }
  docError.value = ''
  docFile.value = file
  const reader = new FileReader()
  reader.onload = () => { docPreview.value = reader.result as string }
  reader.readAsDataURL(file)
}

function removeFile() {
  docFile.value = null
  docPreview.value = null
  docError.value = ''
}

// Step 2 — Correo
const emailInput = ref('')
const emailError = ref('')

// Step 3 — Código de confirmación
const codeDigits = ref(['', '', '', '', '', ''])
const codeError = ref('')

function onDigitInput(e: Event, index: number) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '').slice(-1)
  codeDigits.value[index] = val
  if (val && index < 5) {
    const next = document.getElementById(`digit-${index + 1}`)
    next?.focus()
  }
}

function onDigitKeydown(e: KeyboardEvent, index: number) {
  if (e.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
    const prev = document.getElementById(`digit-${index - 1}`)
    prev?.focus()
  }
}

// Step 4 — Contraseña
const password = ref('')
const passwordConfirm = ref('')
const showPass = ref(false)
const showPassConfirm = ref(false)
const passwordError = ref('')

const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthLabel = computed(() => {
  const s = passwordStrength.value
  if (s === 0) return ''
  if (s === 1) return 'Débil'
  if (s === 2) return 'Regular'
  if (s === 3) return 'Buena'
  return 'Fuerte'
})

const strengthColor = computed(() => {
  const s = passwordStrength.value
  if (s === 1) return 'bg-red-500'
  if (s === 2) return 'bg-yellow-400'
  if (s === 3) return 'bg-blue-400'
  if (s === 4) return 'bg-green-500'
  return 'bg-gray-200'
})

// Navegación modal
function validateStep(): boolean {
  if (currentStep.value === 0) {
    if (!docFile.value) { docError.value = 'Debes subir una imagen de tu INE o Pasaporte.'; return false }
    return true
  }
  if (currentStep.value === 1) {
    if (!emailInput.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
      emailError.value = 'Ingresa un correo electrónico válido.'
      return false
    }
    emailError.value = ''
    return true
  }
  if (currentStep.value === 2) {
    if (codeDigits.value.some(d => !d)) { codeError.value = 'Ingresa el código completo de 6 dígitos.'; return false }
    codeError.value = ''
    return true
  }
  if (currentStep.value === 3) {
    if (password.value.length < 8) { passwordError.value = 'La contraseña debe tener al menos 8 caracteres.'; return false }
    if (password.value !== passwordConfirm.value) { passwordError.value = 'Las contraseñas no coinciden.'; return false }
    passwordError.value = ''
    return true
  }
  return true
}

async function next() {
  if (!validateStep()) return

  if (currentStep.value === 3) {
    const curpKey = localStorage.getItem('curp')
    if (!curpKey) {
      passwordError.value = 'No hay CURP en sesión.'
      return
    }
    transitioning.value = true
    try {
      await api.setPassword(curpKey, password.value)
      localStorage.setItem('auth', 'true')
      sessionAuth.value = true
      sessionBasic.value = false
    } catch (e) {
      passwordError.value = e instanceof Error ? e.message : 'Error al guardar la contraseña.'
      transitioning.value = false
      return
    }
    transitioning.value = false
  } else if (currentStep.value === 0) {
    analyzing.value = true
    await new Promise(r => setTimeout(r, 2200))
    analyzing.value = false
  } else {
    transitioning.value = true
    await new Promise(r => setTimeout(r, 400))
    transitioning.value = false
  }

  if (currentStep.value < steps.value.length - 1) currentStep.value++
}

function prev() {
  if (currentStep.value > 0) currentStep.value--
}

function openModal() {
  currentStep.value = 0
  docFile.value = null
  docPreview.value = null
  docError.value = ''
  emailInput.value = ''
  emailError.value = ''
  codeDigits.value = ['', '', '', '', '', '']
  codeError.value = ''
  password.value = ''
  passwordConfirm.value = ''
  passwordError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

const steps = ref([
  { title: 'Paso 1', label: 'Documento de identidad' },
  { title: 'Paso 2', label: 'Correo de contacto' },
  { title: 'Paso 3', label: 'Código de confirmación' },
  { title: 'Paso 4', label: 'Crea tu contraseña' },
  { title: 'Paso 5', label: '¡Listo!' },
])

// Perfil (se llena desde GET /usuarios/{curp})
const perfil = reactive({
  nombre: '',
  curp: '',
  nss: '',
  telefono: '',
  email: '',
  unidad: '',
})

function splitNombre(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { nombre: '', apellido_paterno: '', apellido_materno: '' }
  if (parts.length === 1) return { nombre: parts[0], apellido_paterno: '', apellido_materno: '' }
  if (parts.length === 2) return { nombre: parts[0], apellido_paterno: parts[1], apellido_materno: '' }
  return { nombre: parts[0], apellido_paterno: parts[1], apellido_materno: parts.slice(2).join(' ') }
}

// Notificaciones
const notifs = reactive<Record<'email' | 'sms' | 'recordatorio' | 'campanas', boolean>>({
  email: true,
  sms: true,
  recordatorio: true,
  campanas: false,
})

function toggleNotif(key: string) {
  const k = key as keyof typeof notifs
  notifs[k] = !notifs[k]
}

async function save(section: string) {
  savingSection.value = section
  try {
    if (section === 'perfil') {
      const { nombre, apellido_paterno, apellido_materno } = splitNombre(perfil.nombre)
      await api.updateUsuario(perfil.curp, {
        ...(nombre ? { nombre } : {}),
        ...(apellido_paterno ? { apellido_paterno } : {}),
        ...(apellido_materno ? { apellido_materno } : {}),
        celular: perfil.telefono || undefined,
        correo: perfil.email || undefined,
      })
    }
  } catch (e) {
    savingSection.value = ''
    alert(e instanceof Error ? e.message : 'Error al guardar')
    return
  }
  savingSection.value = ''
  saved.value = true
  setTimeout(() => saved.value = false, 3000)
}

function logout() {
  localStorage.removeItem('auth')
  localStorage.removeItem('curp')
  localStorage.removeItem('rol')
  localStorage.removeItem('userName')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans" v-if="sessionAuth || sessionBasic">
    <div class="max-w-6xl mx-auto px-6 py-10">

      <p v-if="loadError" class="mb-6 text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3">{{ loadError }}</p>
      <p v-if="loadPerfil" class="mb-6 text-xs text-gray-400 uppercase tracking-widest">Cargando perfil…</p>

      <!-- Header -->
      <div class="flex items-start justify-between mb-10">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-black uppercase">Configuración</h1>
          <p class="text-sm text-gray-400 mt-1">Administra tu perfil y preferencias del sistema</p>
        </div>
        <transition name="fade">
          <div v-if="saved" class="bg-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 flex items-center gap-2">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            Cambios guardados
          </div>
        </transition>
      </div>

      <!-- Wrapper con overlay -->
      <div class="relative">

        <!-- Overlay: solo si es sesión básica (sin contraseña) -->
        <div
          v-if="sessionBasic && !sessionAuth"
          class="absolute inset-0 z-10 flex flex-col items-center gap-3"
          style="backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); background: rgba(249, 250, 251, 0.55);"
        >
          <div class="bg-black text-white px-8 py-3 flex items-center gap-2.5">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6a4 4 0 100-8 4 4 0 000 8zm-8 8a8 8 0 0116 0H4z"/>
            </svg>
            <span class="text-xl font-black uppercase tracking-widest">Usuario no autenticado</span>
          </div>
          <button
            @click="openModal"
            class="text-lg text-blue-400 tracking-wide underline underline-offset-4 hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-none"
          >
            Quiero autenticarme
          </button>
        </div>

        <div class="space-y-6" :class="{ 'pointer-events-none opacity-60': loadPerfil }">

          <!-- Perfil -->
          <section class="bg-white border border-gray-200">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 class="text-sm font-black uppercase tracking-widest text-black">Datos del Asegurado</h2>
                <p class="text-xs text-gray-400 mt-0.5">Información personal vinculada a tu número de seguridad social</p>
              </div>
              <button :disabled="savingSection === 'perfil'" @click="save('perfil')"
                class="bg-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-75 transition-opacity disabled:opacity-40">
                {{ savingSection === 'perfil' ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
            <div class="px-6 py-6">
              <div class="flex items-center gap-4 pb-6 mb-6 border-b border-gray-100">
                <div class="w-14 h-14 bg-black text-white flex items-center justify-center text-xl font-black flex-shrink-0">
                  {{ (perfil.nombre || '?')[0] }}
                </div>
                <div>
                  <p class="font-bold text-black">{{ perfil.nombre }}</p>
                  <p class="text-xs font-mono text-gray-400 mt-0.5">NSS: {{ perfil.nss }}</p>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Nombre completo</label>
                  <input v-model="perfil.nombre" type="text" class="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"/>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">CURP</label>
                  <input v-model="perfil.curp" type="text" disabled class="w-full border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-mono text-gray-400 cursor-not-allowed"/>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">No. Seguridad Social</label>
                  <input v-model="perfil.nss" type="text" disabled class="w-full border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-mono text-gray-400 cursor-not-allowed"/>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Teléfono</label>
                  <input v-model="perfil.telefono" type="tel" class="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"/>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Correo electrónico</label>
                  <input v-model="perfil.email" type="email" class="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"/>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Unidad médica asignada</label>
                  <input v-model="perfil.unidad" type="text" disabled class="w-full border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"/>
                </div>
              </div>
            </div>
          </section>

          <!-- Notificaciones -->
          <section class="bg-white border border-gray-200">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 class="text-sm font-black uppercase tracking-widest text-black">Notificaciones</h2>
                <p class="text-xs text-gray-400 mt-0.5">Recibe recordatorios de vacunación y citas</p>
              </div>
              <button :disabled="savingSection === 'notifs'" @click="save('notifs')"
                class="bg-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-75 transition-opacity disabled:opacity-40">
                {{ savingSection === 'notifs' ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
            <div class="divide-y divide-gray-100">
              <div v-for="(val, key) in notifs" :key="key" class="flex items-center justify-between px-6 py-4">
                <div>
                  <p class="text-sm font-semibold text-black">
                    {{ key === 'email' ? 'Notificaciones por correo' : key === 'sms' ? 'Recordatorio por SMS' : key === 'recordatorio' ? 'Recordatorio de próxima dosis' : 'Alertas de campañas de vacunación' }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ key === 'email' ? 'Resúmenes y avisos a tu correo registrado' : key === 'sms' ? 'Mensaje directo al teléfono capturado' : key === 'recordatorio' ? '7 días antes de cada cita programada' : 'Información sobre jornadas y brigadas del IMSS' }}
                  </p>
                </div>
                <button
                  @click="toggleNotif(key)"
                  :class="val ? 'bg-black' : 'bg-gray-200'"
                  class="relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                >
                  <span
                    :class="val ? 'translate-x-4' : 'translate-x-1'"
                    class="inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200"
                  />
                </button>
              </div>
            </div>
          </section>

          <!-- Acceso -->
          <section class="bg-white border border-gray-200">
            <div class="border-b border-gray-200 px-6 py-4">
              <h2 class="text-sm font-black uppercase tracking-widest text-black">Acceso y Seguridad</h2>
              <p class="text-xs text-gray-400 mt-0.5">Gestiona el acceso a tu expediente digital</p>
            </div>
            <div class="px-6 py-6 space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                <div>
                  <p class="text-sm font-semibold text-black">Método de acceso</p>
                  <p class="text-xs text-gray-400 mt-0.5">CURP · Autenticación vía RENAPO</p>
                </div>
                <span class="text-xs font-bold uppercase tracking-widest text-white bg-black px-2.5 py-1">Activo</span>
              </div>
              <div class="border-t border-gray-100 pt-4">
                <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Zona de datos</p>
                <div class="flex gap-3">
                  <button class="text-xs font-bold uppercase tracking-widest border border-gray-300 text-gray-500 px-4 py-2.5 hover:border-black hover:text-black transition-colors">
                    Solicitar historial completo
                  </button>
                  <button type="button" @click="logout"
                    class="text-xs font-bold uppercase tracking-widest border border-gray-200 text-gray-400 px-4 py-2.5 hover:border-gray-400 transition-colors">
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section v-if="unidadesList.length" class="bg-white border border-gray-200">
            <div class="border-b border-gray-200 px-6 py-4">
              <h2 class="text-sm font-black uppercase tracking-widest text-black">Directorio de unidades médicas</h2>
              <p class="text-xs text-gray-400 mt-0.5">Consulta telefónica (catálogo del sistema)</p>
            </div>
            <div class="px-6 py-4 max-h-52 overflow-y-auto text-xs text-gray-600 space-y-2">
              <p v-for="um in unidadesList" :key="um.id" class="border-b border-gray-50 pb-2 last:border-0">
                <span class="font-semibold text-black">{{ um.nombre }}</span>
                <span class="text-gray-400"> · </span>
                <span>{{ um.telefono || '—' }}</span>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  </div>

  <!-- No hay sesión en absoluto -->
  <div v-else class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-lg font-semibold text-gray-900">Este usuario no está autenticado</p>
      <p class="text-sm text-gray-400 mt-1">Inicia sesión para acceder a tu información.</p>
      <NuxtLink to="/login" class="inline-block mt-4 bg-black text-white text-sm font-semibold px-6 py-2.5 hover:bg-gray-800 transition-colors">
        Ir al inicio de sesión
      </NuxtLink>
    </div>
  </div>

  <!-- Modal carrusel -->
  <transition name="modal">
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center"
      style="background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);" @click.self="closeModal">
      <div class="bg-white w-full max-w-lg mx-4 relative">

        <!-- Header -->
        <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-black uppercase tracking-widest text-black">Cómo autenticarte</h2>
            <p class="text-xs text-gray-400 mt-0.5">{{ steps[currentStep]?.label ?? '' }} · Paso {{ currentStep + 1 }} de {{ steps.length }}</p>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-black transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Barra de progreso -->
        <div class="h-0.5 bg-gray-100">
          <div class="h-0.5 bg-black transition-all duration-500"
            :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"/>
        </div>

        <!-- Contenido -->
        <div class="px-6 py-8 min-h-64 overflow-hidden relative">

          <!-- Loader análisis -->
          <div v-if="analyzing" class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white z-10">
            <div class="relative w-14 h-14">
              <svg class="animate-spin w-14 h-14 text-gray-200" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <svg class="absolute inset-0 m-auto w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div class="text-center">
              <p class="text-sm font-black uppercase tracking-widest text-black">Analizando documento</p>
              <p class="text-xs text-gray-400 mt-1">Verificando autenticidad de la imagen…</p>
            </div>
          </div>

          <!-- Slides -->
          <transition name="slide" mode="out-in">
            <div :key="currentStep" v-if="!analyzing">

              <!-- Paso 1: Subir imagen -->
              <div v-if="currentStep === 0">
                <p class="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Paso 1</p>
                <p class="text-sm font-semibold text-black mb-4">Sube una imagen de tu INE o Pasaporte</p>
                <div v-if="!docPreview"
                  class="border-2 border-dashed border-gray-200 hover:border-black transition-colors cursor-pointer relative"
                  @click="($refs.fileInput as HTMLInputElement).click()">
                  <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange"/>
                  <div class="flex flex-col items-center justify-center py-10 gap-3">
                    <svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <div class="text-center">
                      <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Haz clic para seleccionar</p>
                      <p class="text-xs text-gray-400 mt-0.5">JPG, PNG o WEBP · Máx. 10 MB</p>
                    </div>
                  </div>
                </div>
                <div v-else class="border border-gray-200 relative">
                  <img :src="docPreview" class="w-full object-cover max-h-48"/>
                  <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
                    <p class="text-xs text-gray-500 truncate max-w-xs">{{ docFile?.name }}</p>
                    <button @click="removeFile" class="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors flex-shrink-0 ml-3">
                      Eliminar
                    </button>
                  </div>
                </div>
                <p v-if="docError" class="text-xs text-red-500 mt-2">{{ docError }}</p>
              </div>

              <!-- Paso 2: Correo -->
              <div v-else-if="currentStep === 1">
                <p class="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Paso 2</p>
                <p class="text-sm font-semibold text-black mb-4">Comparte tu correo de contacto</p>
                <p class="text-xs text-gray-500 mb-4 leading-relaxed">Te enviaremos un código de confirmación a este correo. Asegúrate de tener acceso a él.</p>
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Correo electrónico</label>
                <input v-model="emailInput" type="email" placeholder="ejemplo@correo.com"
                  class="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                  :class="{ 'border-red-400': emailError }"/>
                <p v-if="emailError" class="text-xs text-red-500 mt-2">{{ emailError }}</p>
              </div>

              <!-- Paso 3: Código -->
              <div v-else-if="currentStep === 2">
                <p class="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Paso 3</p>
                <p class="text-sm font-semibold text-black mb-1">Código de confirmación</p>
                <p class="text-xs text-gray-500 mb-6 leading-relaxed">
                  Ingresa el código de 6 dígitos que enviamos a <span class="font-semibold text-black">{{ emailInput }}</span>
                </p>
                <div class="flex gap-2 justify-center mb-2">
                  <input
                    v-for="(_, i) in codeDigits" :key="i"
                    :id="`digit-${i}`"
                    type="text" inputmode="numeric" maxlength="1"
                    :value="codeDigits[i]"
                    @input="onDigitInput($event, i)"
                    @keydown="onDigitKeydown($event, i)"
                    class="w-10 h-12 text-center text-lg font-black border border-gray-200 focus:outline-none focus:border-black transition-colors"
                    :class="{ 'border-red-400': codeError && !codeDigits[i] }"/>
                </div>
                <p v-if="codeError" class="text-xs text-red-500 text-center mt-1">{{ codeError }}</p>
                <p class="text-xs text-gray-400 text-center mt-4">
                  ¿No recibiste el código?
                  <button class="text-black font-bold underline underline-offset-2 hover:opacity-60 transition-opacity">Reenviar</button>
                </p>
              </div>

              <!-- Paso 4: Contraseña -->
              <div v-else-if="currentStep === 3">
                <p class="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Paso 4</p>
                <p class="text-sm font-semibold text-black mb-4">Crea tu contraseña</p>
                <div class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Contraseña</label>
                    <div class="relative">
                      <input v-model="password" :type="showPass ? 'text' : 'password'"
                        class="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors pr-10"
                        :class="{ 'border-red-400': passwordError }"/>
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
                    <div v-if="password" class="mt-2 flex items-center gap-2">
                      <div class="flex gap-1 flex-1">
                        <div v-for="i in 4" :key="i"
                          class="h-1 flex-1 rounded-full transition-all duration-300"
                          :class="i <= passwordStrength ? strengthColor : 'bg-gray-100'"/>
                      </div>
                      <span class="text-xs font-bold" :class="{
                        'text-red-500': passwordStrength === 1,
                        'text-yellow-500': passwordStrength === 2,
                        'text-blue-500': passwordStrength === 3,
                        'text-green-500': passwordStrength === 4,
                      }">{{ strengthLabel }}</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Confirmar contraseña</label>
                    <div class="relative">
                      <input v-model="passwordConfirm" :type="showPassConfirm ? 'text' : 'password'"
                        class="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors pr-10"
                        :class="{ 'border-red-400': passwordError }"/>
                      <button @click="showPassConfirm = !showPassConfirm" type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                        <svg v-if="!showPassConfirm" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p v-if="passwordError" class="text-xs text-red-500">{{ passwordError }}</p>
                  <p class="text-xs text-gray-400 leading-relaxed">Mínimo 8 caracteres. Usa mayúsculas, números y símbolos para una contraseña más segura.</p>
                </div>
              </div>

              <!-- Paso 5: Éxito -->
              <div v-else-if="currentStep === 4" class="flex flex-col items-center justify-center py-6 text-center gap-4">
                <div class="w-14 h-14 bg-black flex items-center justify-center">
                  <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-black uppercase tracking-widest text-black">¡Autenticación completada!</p>
                  <p class="text-xs text-gray-400 mt-2 leading-relaxed max-w-xs">
                    Ya puedes utilizar tu cartilla de vacunación digital. Tu cuenta ha sido verificada exitosamente.
                  </p>
                </div>
              </div>

            </div>
          </transition>
        </div>

        <!-- Dots -->
        <div class="flex items-center justify-center gap-2 pb-4">
          <button v-for="(_, i) in steps" :key="i" @click="currentStep = i"
            :class="i === currentStep ? 'bg-black w-5' : 'bg-gray-300 w-2'"
            class="h-2 rounded-full transition-all duration-300"/>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button @click="prev" :disabled="currentStep === 0 || analyzing"
            class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
            Anterior
          </button>

          <button v-if="currentStep < steps.length - 1" @click="next" :disabled="analyzing"
            class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-black text-white px-4 py-2 hover:opacity-75 transition-opacity disabled:opacity-40">
            {{ analyzing ? 'Analizando…' : 'Siguiente' }}
            <svg v-if="!analyzing" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          <button v-else @click="closeModal"
            class="text-xs font-bold uppercase tracking-widest bg-black text-white px-4 py-2 hover:opacity-75 transition-opacity">
            Entendido
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-enter-from { opacity: 0; transform: translateX(20px); }
.slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>