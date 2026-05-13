<script setup lang="ts">
import Swal from 'sweetalert2'

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

const perfil = reactive({
  nombre: '',
  curp: '',
  nss: '',
  telefono: '',
  email: '',
  unidad: '',
})

onMounted(async () => {
  sessionAuth.value = localStorage.getItem('auth') === 'true'
  sessionBasic.value = localStorage.getItem('auth') === 'false' && !!localStorage.getItem('curp')
  const curp = localStorage.getItem('curp')
  if (!curp) { loadPerfil.value = false; return }
  perfil.curp = curp
  try {
    const u = await api.getUsuario(curp) as {
      nombre: string; apellido_paterno: string | null; apellido_materno: string | null
      nss: string | null; celular: string | null; correo: string | null
      unidad_nombre: string | null; ciudad: string | null
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

// Auth wizard
const docFile = ref<File | null>(null)
const docPreview = ref<string | null>(null)
const docError = ref('')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { docError.value = 'Solo se aceptan imagenes (JPG, PNG, WEBP).'; return }
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

const emailInput = ref('')
const emailError = ref('')

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
  if (s === 1) return 'Debil'
  if (s === 2) return 'Regular'
  if (s === 3) return 'Buena'
  return 'Fuerte'
})

function validateStep(): boolean {
  if (currentStep.value === 0) {
    if (!docFile.value) { docError.value = 'Sube una imagen de tu INE o Pasaporte.'; return false }
    return true
  }
  if (currentStep.value === 1) {
    if (!emailInput.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
      emailError.value = 'Ingresa un correo electronico valido.'
      return false
    }
    emailError.value = ''
    return true
  }
  if (currentStep.value === 2) {
    if (codeDigits.value.some(d => !d)) { codeError.value = 'Ingresa el codigo de 6 digitos.'; return false }
    codeError.value = ''
    return true
  }
  if (currentStep.value === 3) {
    if (password.value.length < 8) { passwordError.value = 'Minimo 8 caracteres.'; return false }
    if (password.value !== passwordConfirm.value) { passwordError.value = 'Las contrasenas no coinciden.'; return false }
    passwordError.value = ''
    return true
  }
  return true
}

async function next() {
  if (!validateStep()) return
  if (currentStep.value === 3) {
    const curpKey = localStorage.getItem('curp')
    if (!curpKey) { passwordError.value = 'No hay CURP en sesion.'; return }
    transitioning.value = true
    try {
      await api.setPassword(curpKey, password.value)
      localStorage.setItem('auth', 'true')
      sessionAuth.value = true
      sessionBasic.value = false
    } catch (e) {
      passwordError.value = e instanceof Error ? e.message : 'Error al guardar la contrasena.'
      transitioning.value = false
      return
    }
    transitioning.value = false
  } else if (currentStep.value === 0) {
    analyzing.value = true
    await new Promise(r => setTimeout(r, 1800))
    analyzing.value = false
  } else {
    transitioning.value = true
    await new Promise(r => setTimeout(r, 350))
    transitioning.value = false
  }
  if (currentStep.value < steps.value.length - 1) currentStep.value++
}

function prev() { if (currentStep.value > 0) currentStep.value-- }

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
function closeModal() { showModal.value = false }

const steps = ref([
  { num: '01', label: 'Documento' },
  { num: '02', label: 'Correo' },
  { num: '03', label: 'Codigo' },
  { num: '04', label: 'Contrasena' },
  { num: '05', label: 'Listo' },
])

function splitNombre(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { nombre: '', apellido_paterno: '', apellido_materno: '' }
  if (parts.length === 1) return { nombre: parts[0], apellido_paterno: '', apellido_materno: '' }
  if (parts.length === 2) return { nombre: parts[0], apellido_paterno: parts[1], apellido_materno: '' }
  return { nombre: parts[0], apellido_paterno: parts[1], apellido_materno: parts.slice(2).join(' ') }
}

const notifs = reactive<Record<'email' | 'sms' | 'recordatorio' | 'campanas', boolean>>({
  email: true, sms: true, recordatorio: true, campanas: false,
})

function toggleNotif(key: string) {
  const k = key as keyof typeof notifs
  notifs[k] = !notifs[k]
}

const notifLabels: Record<string, { title: string; desc: string }> = {
  email:        { title: 'Notificaciones por correo', desc: 'Resumenes y avisos a tu correo registrado' },
  sms:          { title: 'Recordatorio por SMS',       desc: 'Mensaje directo al telefono capturado' },
  recordatorio: { title: 'Recordatorio de proxima dosis', desc: '7 dias antes de cada cita programada' },
  campanas:     { title: 'Alertas de campanas',         desc: 'Jornadas y brigadas de vacunacion' },
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
    await Swal.fire({ icon: 'error', title: 'Error al guardar', text: e instanceof Error ? e.message : 'No se pudieron guardar los cambios.', confirmButtonColor: '#0E5037' })
    return
  }
  savingSection.value = ''
  saved.value = true
  setTimeout(() => saved.value = false, 2400)
}

function logout() {
  localStorage.removeItem('auth')
  localStorage.removeItem('curp')
  localStorage.removeItem('rol')
  localStorage.removeItem('userName')
  localStorage.removeItem('noRegistrado')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen" v-if="sessionAuth || sessionBasic">
    <div class="max-w-4xl mx-auto px-6 lg:px-12 py-10 lg:py-14">

      <!-- Header editorial -->
      <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 mb-10 border-b-2" style="border-color: var(--ink)">
        <div>
          <p class="eyebrow">Mi cuenta</p>
          <h1 class="font-display text-4xl sm:text-5xl mt-3 leading-[1] tracking-tight" style="font-weight: 400">
            Mi <em class="italic">informacion.</em>
          </h1>
        </div>
        <transition name="fade">
          <p v-if="saved" class="eyebrow flex items-center gap-2" style="color: var(--moss)">
            <span class="font-mono">●</span> Cambios guardados
          </p>
        </transition>
      </header>

      <p v-if="loadError" class="mb-6 px-3 py-2.5 border-l-2 text-sm" style="border-color: var(--wine); color: var(--wine); background: rgba(153,27,27,0.04)">{{ loadError }}</p>

      <div class="relative">

        <!-- Overlay acceso basico -->
        <div v-if="sessionBasic && !sessionAuth"
          class="absolute inset-0 z-10 flex flex-col items-center justify-start pt-20 gap-4"
          style="backdrop-filter: blur(6px); background: rgba(245,241,232,0.7)">
          <div class="max-w-sm text-center px-6 py-8" style="background: var(--surface); border: 1px solid var(--border)">
            <p class="eyebrow">Acceso limitado</p>
            <h3 class="font-display text-2xl mt-2 mb-3" style="font-weight: 500">Crea una <em class="italic">contrasena.</em></h3>
            <p class="text-sm mb-5" style="color: var(--muted)">Para editar tu perfil necesitas autenticar tu identidad.</p>
            <button @click="openModal" class="btn-primary text-sm w-full">Autenticarme</button>
          </div>
        </div>

        <div class="space-y-12" :class="{ 'pointer-events-none opacity-50': loadPerfil }">

          <!-- Perfil -->
          <section>
            <div class="flex items-baseline justify-between border-b pb-2 mb-6" style="border-color: var(--ink)">
              <div>
                <h2 class="font-display text-2xl" style="font-weight: 500">Datos del asegurado</h2>
                <p class="eyebrow mt-1">Informacion personal</p>
              </div>
              <button :disabled="savingSection === 'perfil'" @click="save('perfil')" class="btn-primary text-sm">
                {{ savingSection === 'perfil' ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>

            <div class="flex items-center gap-4 pb-6 mb-6 border-b" style="border-color: var(--border)">
              <div class="w-14 h-14 flex items-center justify-center font-mono text-base" style="background: var(--moss-dark); color: var(--paper); font-weight: 600; letter-spacing: 0.05em">
                {{ (perfil.nombre || '?').charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-display text-xl" style="font-weight: 500">{{ perfil.nombre }}</p>
                <p class="font-mono text-[11px] mt-1 tabular" style="color: var(--muted); letter-spacing: 0.08em">NSS · {{ perfil.nss || '—' }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="eyebrow">Nombre completo</label>
                <input v-model="perfil.nombre" type="text" class="field mt-1.5" />
              </div>
              <div>
                <label class="eyebrow">CURP</label>
                <input v-model="perfil.curp" type="text" disabled class="field mono mt-1.5 uppercase" style="background: var(--bone); color: var(--muted)" />
              </div>
              <div>
                <label class="eyebrow">NSS</label>
                <input v-model="perfil.nss" type="text" disabled class="field mono mt-1.5 tabular" style="background: var(--bone); color: var(--muted)" />
              </div>
              <div>
                <label class="eyebrow">Telefono</label>
                <input v-model="perfil.telefono" type="tel" class="field mt-1.5" />
              </div>
              <div class="sm:col-span-2">
                <label class="eyebrow">Correo electronico</label>
                <input v-model="perfil.email" type="email" class="field mt-1.5" />
              </div>
              <div class="sm:col-span-2">
                <label class="eyebrow">Unidad medica</label>
                <input v-model="perfil.unidad" type="text" disabled class="field mt-1.5" style="background: var(--bone); color: var(--muted)" />
              </div>
            </div>
          </section>

          <!-- Notificaciones -->
          <section>
            <div class="border-b pb-2 mb-6" style="border-color: var(--ink)">
              <h2 class="font-display text-2xl" style="font-weight: 500">Notificaciones</h2>
              <p class="eyebrow mt-1">Como quieres que te avisemos</p>
            </div>

            <div>
              <div v-for="(val, key, idx) in notifs" :key="key"
                class="flex items-center justify-between py-5 gap-4"
                :style="idx < Object.keys(notifs).length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
                <div class="min-w-0">
                  <p class="text-sm" style="font-weight: 500">{{ notifLabels[key]?.title }}</p>
                  <p class="text-xs mt-0.5" style="color: var(--muted)">{{ notifLabels[key]?.desc }}</p>
                </div>
                <button @click="toggleNotif(key)"
                  class="w-11 h-6 transition-colors flex-shrink-0 relative"
                  :style="val ? 'background: var(--moss)' : 'background: var(--border)'">
                  <span class="absolute top-0.5 w-5 h-5 transition-transform duration-200"
                    :style="`background: white; transform: translateX(${val ? '22px' : '2px'})`" />
                </button>
              </div>
            </div>
          </section>

          <!-- Acceso -->
          <section>
            <div class="border-b pb-2 mb-6" style="border-color: var(--ink)">
              <h2 class="font-display text-2xl" style="font-weight: 500">Acceso y seguridad</h2>
              <p class="eyebrow mt-1">Gestion de tu sesion</p>
            </div>

            <div class="flex items-baseline justify-between py-4">
              <div>
                <p class="text-sm" style="font-weight: 500">Metodo de acceso</p>
                <p class="text-xs mt-0.5" style="color: var(--muted)">CURP + contrasena</p>
              </div>
              <span class="font-mono text-[10px] uppercase tracking-widest" style="color: var(--moss)">● Activo</span>
            </div>

            <button type="button" @click="logout" class="btn-ghost text-sm mt-4 flex items-center gap-2">
              <span class="font-mono">←</span> Cerrar sesion
            </button>
          </section>

          <!-- Unidades -->
          <section v-if="unidadesList.length">
            <div class="border-b pb-2 mb-6" style="border-color: var(--ink)">
              <h2 class="font-display text-2xl" style="font-weight: 500">Directorio</h2>
              <p class="eyebrow mt-1">Unidades medicas disponibles</p>
            </div>

            <div class="max-h-64 overflow-y-auto">
              <div v-for="(um, i) in unidadesList" :key="um.id"
                class="flex items-baseline justify-between gap-3 py-3"
                :style="i < unidadesList.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
                <span class="text-sm" style="font-weight: 500">{{ um.nombre }}</span>
                <span class="font-mono text-xs tabular" style="color: var(--muted); letter-spacing: 0.06em">{{ um.telefono || '—' }}</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  </div>

  <!-- Sin sesion -->
  <div v-else class="min-h-screen flex items-center justify-center px-6">
    <div class="text-center max-w-md">
      <p class="eyebrow">Sesion expirada</p>
      <h1 class="font-display text-4xl mt-3" style="font-weight: 400">No hay <em class="italic">sesion activa.</em></h1>
      <p class="mt-3 text-sm" style="color: var(--muted)">Inicia sesion para acceder a tu informacion.</p>
      <NuxtLink to="/login" class="btn-primary inline-flex items-center gap-2 mt-7 text-sm">
        Ir al inicio <span class="font-mono">→</span>
      </NuxtLink>
    </div>
  </div>

  <!-- Modal autenticacion -->
  <transition name="modal">
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center px-4"
      style="background: rgba(28,27,23,0.6); backdrop-filter: blur(4px)" @click.self="closeModal">
      <div class="w-full max-w-lg relative" style="background: var(--paper); border: 1px solid var(--border)">

        <!-- Header -->
        <div class="px-6 py-5 flex items-baseline justify-between" style="border-bottom: 1px solid var(--border)">
          <div>
            <p class="eyebrow">Autenticacion</p>
            <h2 class="font-display text-xl mt-1" style="font-weight: 500">{{ steps[currentStep]?.label }}</h2>
          </div>
          <div class="flex items-baseline gap-3">
            <p class="font-mono text-xs tabular" style="color: var(--muted); letter-spacing: 0.08em">{{ currentStep + 1 }} / {{ steps.length }}</p>
            <button @click="closeModal" class="text-xl opacity-60 hover:opacity-100 transition-opacity">×</button>
          </div>
        </div>

        <!-- Progress -->
        <div class="h-[2px]" style="background: var(--bone)">
          <div class="h-[2px] transition-all duration-500" :style="`width: ${((currentStep + 1) / steps.length) * 100}%; background: var(--moss)`" />
        </div>

        <!-- Content -->
        <div class="px-6 py-8 min-h-[280px] overflow-hidden relative">
          <div v-if="analyzing" class="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10" style="background: var(--paper)">
            <div class="w-8 h-8 border-2 rounded-full animate-spin" style="border-color: var(--moss); border-top-color: transparent" />
            <div class="text-center">
              <p class="eyebrow">Analizando documento</p>
              <p class="font-display text-lg mt-1" style="font-weight: 500">Verificando autenticidad…</p>
            </div>
          </div>

          <transition name="slide" mode="out-in">
            <div :key="currentStep" v-if="!analyzing">

              <!-- Step 1 -->
              <div v-if="currentStep === 0">
                <p class="text-sm mb-4" style="color: var(--muted)">Sube una imagen clara de tu INE o pasaporte.</p>
                <div v-if="!docPreview"
                  class="border border-dashed cursor-pointer transition-colors py-12 text-center"
                  style="border-color: var(--border)"
                  @click="($refs.fileInput as HTMLInputElement).click()"
                  @mouseover="(e: any) => e.currentTarget.style.borderColor = 'var(--moss)'"
                  @mouseleave="(e: any) => e.currentTarget.style.borderColor = 'var(--border)'">
                  <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                  <p class="font-display text-lg" style="font-weight: 500">Selecciona una imagen</p>
                  <p class="eyebrow mt-2">JPG · PNG · WEBP</p>
                </div>
                <div v-else>
                  <img :src="docPreview" class="w-full object-cover max-h-48" style="border: 1px solid var(--border)" />
                  <div class="flex items-center justify-between mt-2.5 px-2.5 py-1.5" style="background: var(--bone)">
                    <p class="text-xs truncate" style="color: var(--muted)">{{ docFile?.name }}</p>
                    <button @click="removeFile" class="text-xs" style="color: var(--wine); font-family: var(--font-mono); letter-spacing: 0.08em">eliminar</button>
                  </div>
                </div>
                <p v-if="docError" class="text-xs mt-3" style="color: var(--wine)">{{ docError }}</p>
              </div>

              <!-- Step 2 -->
              <div v-else-if="currentStep === 1">
                <p class="text-sm mb-5" style="color: var(--muted)">Te enviaremos un codigo de confirmacion.</p>
                <label class="eyebrow">Correo electronico</label>
                <input v-model="emailInput" type="email" placeholder="ejemplo@correo.com" class="field mt-2"
                  :style="emailError ? 'border-color: var(--wine)' : ''" />
                <p v-if="emailError" class="text-xs mt-2" style="color: var(--wine)">{{ emailError }}</p>
              </div>

              <!-- Step 3 -->
              <div v-else-if="currentStep === 2">
                <p class="text-sm mb-1" style="color: var(--muted)">Ingresa el codigo enviado a</p>
                <p class="font-mono text-sm mb-6" style="font-weight: 500">{{ emailInput }}</p>
                <div class="flex gap-2 justify-center mb-2">
                  <input
                    v-for="(_, i) in codeDigits" :key="i"
                    :id="`digit-${i}`"
                    type="text" inputmode="numeric" maxlength="1"
                    :value="codeDigits[i]"
                    @input="onDigitInput($event, i)"
                    @keydown="onDigitKeydown($event, i)"
                    class="w-11 h-13 text-center font-mono text-lg tabular field"
                    style="padding: 12px 0"
                    :style="codeError && !codeDigits[i] ? 'border-color: var(--wine)' : ''" />
                </div>
                <p v-if="codeError" class="text-xs text-center mt-3" style="color: var(--wine)">{{ codeError }}</p>
                <p class="text-xs text-center mt-5" style="color: var(--muted)">
                  No recibiste el codigo?
                  <button class="ml-1 font-mono text-xs hover:opacity-70" style="color: var(--moss); letter-spacing: 0.08em">reenviar</button>
                </p>
              </div>

              <!-- Step 4 -->
              <div v-else-if="currentStep === 3">
                <p class="text-sm mb-5" style="color: var(--muted)">Crea una contrasena segura.</p>
                <div class="space-y-4">
                  <div>
                    <label class="eyebrow">Contrasena</label>
                    <div class="relative mt-2">
                      <input v-model="password" :type="showPass ? 'text' : 'password'" class="field pr-14"
                        :style="passwordError ? 'border-color: var(--wine)' : ''" />
                      <button @click="showPass = !showPass" type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                        style="color: var(--muted)">
                        {{ showPass ? 'ocultar' : 'ver' }}
                      </button>
                    </div>
                    <div v-if="password" class="mt-2.5 flex items-center gap-2">
                      <div class="flex gap-1 flex-1">
                        <div v-for="i in 4" :key="i"
                          class="h-[2px] flex-1 transition-all duration-300"
                          :style="`background: ${i <= passwordStrength ? (passwordStrength === 4 ? 'var(--moss)' : passwordStrength === 3 ? 'var(--moss)' : passwordStrength === 2 ? 'var(--ochre)' : 'var(--wine)') : 'var(--bone)'}`" />
                      </div>
                      <span class="font-mono text-[10px] uppercase tracking-wider" style="letter-spacing: 0.12em; color: var(--muted)">{{ strengthLabel }}</span>
                    </div>
                  </div>
                  <div>
                    <label class="eyebrow">Confirmar</label>
                    <div class="relative mt-2">
                      <input v-model="passwordConfirm" :type="showPassConfirm ? 'text' : 'password'" class="field pr-14"
                        :style="passwordError ? 'border-color: var(--wine)' : ''" />
                      <button @click="showPassConfirm = !showPassConfirm" type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                        style="color: var(--muted)">
                        {{ showPassConfirm ? 'ocultar' : 'ver' }}
                      </button>
                    </div>
                  </div>
                  <p v-if="passwordError" class="text-xs" style="color: var(--wine)">{{ passwordError }}</p>
                  <p class="text-xs" style="color: var(--muted)">Minimo 8 caracteres. Recomendado: mayusculas, numeros y simbolos.</p>
                </div>
              </div>

              <!-- Step 5 -->
              <div v-else-if="currentStep === 4" class="flex flex-col items-center justify-center py-6 text-center gap-3">
                <div class="font-mono text-3xl" style="color: var(--moss)">✓</div>
                <div>
                  <p class="eyebrow" style="color: var(--moss)">Completado</p>
                  <p class="font-display text-2xl mt-2" style="font-weight: 500">Tu cuenta esta <em class="italic">verificada.</em></p>
                  <p class="text-sm mt-3 max-w-xs mx-auto" style="color: var(--muted)">Ya puedes usar tu cartilla de vacunacion digital.</p>
                </div>
              </div>

            </div>
          </transition>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 flex items-center justify-between" style="border-top: 1px solid var(--border)">
          <button @click="prev" :disabled="currentStep === 0 || analyzing"
            class="flex items-center gap-2 text-sm transition-opacity disabled:opacity-25 disabled:cursor-not-allowed hover:opacity-70"
            style="font-family: var(--font-mono); letter-spacing: 0.08em">
            ← Anterior
          </button>

          <button v-if="currentStep < steps.length - 1" @click="next" :disabled="analyzing" class="btn-primary text-sm flex items-center gap-2">
            {{ analyzing ? 'Analizando…' : 'Siguiente' }}
            <span v-if="!analyzing" class="font-mono">→</span>
          </button>

          <button v-else @click="closeModal" class="btn-primary text-sm">Entendido</button>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-enter-from { opacity: 0; transform: translateX(20px); }
.slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
