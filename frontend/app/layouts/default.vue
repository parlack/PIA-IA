<script setup lang="ts">
import { esRolAdmin, normalizarRolParaStorage } from '~/utils/rol'

const router = useRouter()
const route = useRoute()
const api = useApi()

const user = ref({ name: '', email: '' })
const rol = ref('')

const nav = computed(() => {
  const items = [
    { label: 'Mis vacunas', icon: '▦', to: '/dashboard' },
    { label: 'Mi información', icon: '⚙', to: '/settings' },
  ]
  if (esRolAdmin(rol.value)) {
    items.push({ label: 'Administración', icon: '◆', to: '/admin' })
  }
  return items
})

function logout() {
  localStorage.removeItem('auth')
  localStorage.removeItem('curp')
  localStorage.removeItem('rol')
  localStorage.removeItem('userName')
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
  if (storedName) {
    user.value.name = storedName
  }

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
</script>

<template>
  <div class="shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="flex justify-center">
      </div>

      <nav class="nav">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: route.path === item.to }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="avatar">{{ (user.name || '?')[0] }}</div>
          <div class="user-info">
            <p class="user-name">{{ user.name || 'Usuario' }}</p>
          </div>
        </div>
        <button type="button" class="logout-btn" title="Cerrar sesión" @click="logout">
          ⎋
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
  width: 230px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 28px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 36px;
}

.brand-icon {
  font-size: 22px;
  color: var(--accent);
}

.brand-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  transition: all 0.18s;
  letter-spacing: 0.02em;
}

.nav-item:hover {
  background: var(--border);
  color: var(--text);
}

.nav-item.active {
  background: rgba(108, 99, 255, 0.15);
  color: var(--accent);
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

/* ── Sidebar footer ── */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: var(--muted);
  font-family: var(--font-mono);
}

.logout-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  flex-shrink: 0;
  cursor: pointer;
}

.logout-btn:hover {
  border-color: var(--accent-2);
  color: var(--accent-2);
}

/* ── Content area ── */
.content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}
</style>
