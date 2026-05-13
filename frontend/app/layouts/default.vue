<script setup lang="ts">
import { esRolAdmin, normalizarRolParaStorage } from '~/utils/rol'

const router = useRouter()
const route = useRoute()
const api = useApi()
const { t } = useI18n()
const { noLeidos } = useDashboardData()

const user = ref({ name: '', email: '' })
const rol = ref('')
const sidebarOpen = ref(false)

type NavIconName =
  | 'summary'
  | 'vaccines'
  | 'allergies'
  | 'aefi'
  | 'inbox'
  | 'dependents'
  | 'medical-unit'
  | 'my-info'
  | 'admin'

type NavItem = {
  to: string
  label: string
  num: string
  icon: NavIconName
  authOnly?: boolean
  badge?: () => number
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const isAuthed = computed(
  () => typeof localStorage !== 'undefined' && localStorage.getItem('auth') === 'true'
)

const groups = computed<NavGroup[]>(() => {
  // El admin solo ve el panel de sistema: ninguna seccion de ciudadano
  if (esRolAdmin(rol.value)) {
    return [
      {
        label: t('nav.groupSystem'),
        items: [
          { to: '/admin', label: t('nav.admin'), num: '01', icon: 'admin' },
        ],
      },
    ]
  }

  const result: NavGroup[] = [
    {
      label: t('nav.groupHealth'),
      items: [
        { to: '/dashboard',  label: t('nav.summary'),    num: '01', icon: 'summary' },
        { to: '/vacunas',    label: t('nav.vaccines'),   num: '02', icon: 'vaccines' },
        { to: '/alergias',   label: t('nav.allergies'),  num: '03', icon: 'allergies' },
        { to: '/aefi',       label: t('nav.aefi'),       num: '04', icon: 'aefi' },
      ],
    },
    {
      label: t('nav.groupServices'),
      items: [
        { to: '/mensajes',      label: t('nav.inbox'),       num: '05', icon: 'inbox', badge: () => noLeidos.value },
        { to: '/unidad-medica', label: t('nav.medicalUnit'), num: '06', icon: 'medical-unit' },
      ],
    },
  ]

  if (isAuthed.value) {
    result[1]!.items.splice(1, 0, {
      to: '/dependientes',
      label: t('nav.dependents'),
      num: '07',
      icon: 'dependents',
      authOnly: true,
    })
  }

  result.push({
    label: t('nav.groupAccount'),
    items: [
      { to: '/settings', label: t('nav.myInfo'), num: '08', icon: 'my-info' },
    ],
  })

  return result
})

const session = useSession()

function logout() {
  session.logout()
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
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return n.slice(0, 2).toUpperCase()
})
</script>

<template>
  <div class="min-h-screen flex" style="background: var(--paper)">

    <transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 lg:hidden"
        style="background: rgba(28,27,23,0.5)"
        @click="sidebarOpen = false"
      />
    </transition>

    <aside
      class="fixed lg:sticky top-0 left-0 z-40 h-screen w-[280px] flex flex-col transition-transform duration-300 lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      style="background: var(--moss-dark); color: var(--paper); border-right: 1px solid rgba(245,241,232,0.08)"
    >
      <div class="px-7 pt-7 pb-6">
        <div class="flex items-center gap-3">
          <img
            src="/pia-logo.png"
            alt="PIA-IA"
            class="h-9 w-auto"
            style="filter: brightness(0) invert(1)"
          />
          <div>
            <p class="font-display text-base leading-none" style="font-weight: 500">PIA-IA</p>
            <p
              class="text-[10px] mt-1.5 opacity-60"
              style="font-family: var(--font-mono); letter-spacing: 0.14em"
            >
              CARTILLA DIGITAL
            </p>
          </div>
        </div>
      </div>

      <div class="h-px mx-7 mb-5" style="background: rgba(245,241,232,0.1)" />

      <nav class="flex-1 px-7 overflow-y-auto pb-4">
        <div
          v-for="(group, gi) in groups"
          :key="group.label"
          :class="gi > 0 ? 'mt-7' : ''"
        >
          <p class="eyebrow mb-2.5" style="color: rgba(245,241,232,0.45)">
            {{ group.label }}
          </p>

          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-link group flex items-center justify-between py-2.5 transition-colors relative"
            :class="{ 'is-active': route.path === item.to }"
            @click="sidebarOpen = false"
          >
            <span class="flex items-center gap-3 min-w-0">
              <span class="nav-link__icon">
                <NavIcon :name="item.icon" :size="17" />
              </span>
              <span class="text-[14.5px] truncate" style="font-weight: 400">{{ item.label }}</span>
            </span>
            <span class="flex items-center gap-2">
              <span
                v-if="item.badge && item.badge()"
                class="font-mono text-[9px] px-1.5 py-0.5"
                style="background: var(--moss); color: var(--paper); letter-spacing: 0.06em"
              >
                {{ item.badge() }}
              </span>
              <span v-if="route.path === item.to" class="font-mono text-xs">→</span>
            </span>
          </NuxtLink>
        </div>
      </nav>

      <div class="px-7 py-5" style="border-top: 1px solid rgba(245,241,232,0.1)">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 flex items-center justify-center font-mono text-xs"
            style="background: var(--moss); color: var(--paper); font-weight: 600; letter-spacing: 0.05em"
          >
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm truncate" style="font-weight: 500">{{ user.name || 'Usuario' }}</p>
            <p
              class="text-[11px] opacity-60 uppercase tracking-wider"
              style="font-family: var(--font-mono)"
            >
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
          <span>← {{ t('common.logout') }}</span>
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">

      <header
        class="lg:hidden sticky top-0 z-20 flex items-center justify-between px-5 py-3.5"
        style="background: var(--paper); border-bottom: 1px solid var(--border)"
      >
        <button
          type="button"
          class="flex items-center gap-2 text-sm transition-opacity"
          style="font-family: var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase"
          @click="sidebarOpen = true"
        >
          <span class="text-lg">≡</span>
          <span>{{ t('nav.menu') }}</span>
        </button>
        <img src="/pia-logo.png" alt="PIA-IA" class="h-7 w-auto" />
        <div class="w-12" />
      </header>

      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.nav-link {
  color: rgba(245, 241, 232, 0.55);
}
.nav-link:hover {
  color: var(--paper);
}
.nav-link.is-active {
  color: var(--paper);
}
.nav-link__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: inherit;
  opacity: 0.75;
  transition: opacity 0.15s ease;
}
.nav-link:hover .nav-link__icon,
.nav-link.is-active .nav-link__icon {
  opacity: 1;
}
</style>
