<script setup lang="ts">
import { esRolAdmin, normalizarRolParaStorage } from '~/utils/rol'

const router = useRouter()
const route = useRoute()
const api = useApi()

const user = ref({ name: '', email: '' })
const rol = ref('')
const sidebarOpen = ref(false)

const nav = computed(() => {
  const items = [
    { label: 'Cartilla',     to: '/dashboard', num: '01' },
    { label: 'Mi informacion', to: '/settings', num: '02' },
  ]
  if (esRolAdmin(rol.value)) {
    items.push({ label: 'Administracion', to: '/admin', num: '03' })
  }
  return items
})

function logout() {
  localStorage.removeItem('auth')
  localStorage.removeItem('curp')
  localStorage.removeItem('rol')
  localStorage.removeItem('userName')
  localStorage.removeItem('noRegistrado')
  router.push('/login')
}

onMounted(async () => {
  const auth = localStorage.getItem('auth')
  if (auth === null) {
    router.replace('/login')
    return
  }
  rol.value = normalizarRolParaStorage(localStorage.getItem('rol'))

  const storedName = localStorage.getItem('userName')
  if (storedName) user.value.name = storedName

  const curp = localStorage.getItem('curp')
  if (curp) {
    try {
      const u = await api.getUsuario(curp) as {
        nombre: string
        apellido_paterno: string
        correo: string | null
        rol?: string
      }
      if (u.rol != null && u.rol !== '') {
        const nr = normalizarRolParaStorage(u.rol)
        rol.value = nr
        localStorage.setItem('rol', nr)
      }
      const display = [u.nombre, u.apellido_paterno].filter(Boolean).join(' ').trim()
      if (display) user.value.name = display
      user.value.email = u.correo || ''
    } catch {
      if (!user.value.name) user.value.name = 'Usuario'
    }
  } else if (!user.value.name) {
    user.value.name = 'Usuario'
  }
})

const initials = computed(() => {
  const n = user.value.name || '?'
  const parts = n.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return n.slice(0, 2).toUpperCase()
})
</script>

<template>
  <div class="min-h-screen flex" style="background: var(--paper)">

    <!-- Overlay movil -->
    <transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 lg:hidden"
        style="background: rgba(28,27,23,0.5)"
        @click="sidebarOpen = false"
      />
    </transition>

    <!-- Sidebar editorial -->
    <aside
      class="fixed lg:sticky top-0 left-0 z-40 h-screen w-[280px] flex flex-col transition-transform duration-300 lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      style="background: var(--moss-dark); color: var(--paper); border-right: 1px solid rgba(245,241,232,0.08)"
    >
      <!-- Brand -->
      <div class="px-7 pt-7 pb-6">
        <div class="flex items-center gap-3">
          <img src="/pia-logo.png" alt="PIA-IA" class="h-9 w-auto" style="filter: brightness(0) invert(1)" />
          <div>
            <p class="font-display text-base leading-none" style="font-weight: 500">PIA-IA</p>
            <p class="text-[10px] mt-1.5 opacity-60" style="font-family: var(--font-mono); letter-spacing: 0.14em">CARTILLA DIGITAL</p>
          </div>
        </div>
      </div>

      <div class="h-px mx-7 mb-6" style="background: rgba(245,241,232,0.1)" />

      <!-- Nav -->
      <nav class="flex-1 px-7 space-y-1 overflow-y-auto">
        <p class="eyebrow mb-3" style="color: rgba(245,241,232,0.5)">Secciones</p>

        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="group flex items-center justify-between py-3 transition-colors relative"
          :style="route.path === item.to ? 'color: var(--paper)' : 'color: rgba(245,241,232,0.55)'"
          @click="sidebarOpen = false"
        >
          <span class="flex items-center gap-4">
            <span class="font-mono text-[11px] opacity-50">{{ item.num }}</span>
            <span class="font-display text-lg" style="font-weight: 400">{{ item.label }}</span>
          </span>
          <span v-if="route.path === item.to" class="font-mono text-sm">→</span>
        </NuxtLink>
      </nav>

      <!-- Footer usuario -->
      <div class="px-7 py-6 mt-4" style="border-top: 1px solid rgba(245,241,232,0.1)">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 flex items-center justify-center font-mono text-xs" style="background: var(--moss); color: var(--paper); font-weight: 600; letter-spacing: 0.05em">
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm truncate" style="font-weight: 500">{{ user.name || 'Usuario' }}</p>
            <p class="text-[11px] opacity-60 uppercase tracking-wider" style="font-family: var(--font-mono)">
              {{ esRolAdmin(rol) ? 'Administrador' : 'Asegurado' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-[11px] flex items-center gap-2 hover:opacity-100 transition-opacity"
          style="font-family: var(--font-mono); letter-spacing: 0.12em; text-transform: uppercase; color: rgba(245,241,232,0.55)"
          @click="logout"
        >
          <span>← Cerrar sesion</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0">

      <!-- Top bar movil -->
      <header class="lg:hidden sticky top-0 z-20 flex items-center justify-between px-5 py-3.5"
        style="background: var(--paper); border-bottom: 1px solid var(--border)">
        <button
          type="button"
          class="flex items-center gap-2 text-sm transition-opacity"
          style="font-family: var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase"
          @click="sidebarOpen = true"
        >
          <span class="text-lg">≡</span>
          <span>Menu</span>
        </button>
        <img src="/pia-logo.png" alt="PIA-IA" class="h-7 w-auto" />
        <div class="w-12" />
      </header>

      <!-- Content -->
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
