<script setup lang="ts">
import { esRolAdmin, normalizarRolParaStorage } from '~/utils/rol'

interface ErrorProps {
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}

const props = defineProps<ErrorProps>()

useHead({ title: props.error?.statusCode === 404 ? 'Página no encontrada' : 'Error' })

const code = computed(() => props.error?.statusCode ?? 500)
const titulo = computed(() => {
  if (code.value === 404) return 'Página no encontrada'
  if (code.value === 403) return 'Acceso denegado'
  if (code.value >= 500) return 'Algo salió mal'
  return 'Error inesperado'
})

const subtitulo = computed(() => {
  if (code.value === 404) return 'La página que buscas no existe o fue movida.'
  if (code.value === 403) return 'No tienes permisos para ver esta sección.'
  return 'Estamos teniendo un problema técnico. Intenta de nuevo en unos minutos.'
})

function volverInicio() {
  const curp = typeof localStorage !== 'undefined' ? localStorage.getItem('curp') : null
  if (!curp) {
    clearError({ redirect: '/login' })
    return
  }
  const rol = normalizarRolParaStorage(localStorage.getItem('rol'))
  clearError({ redirect: esRolAdmin(rol) ? '/admin' : '/dashboard' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper); color: var(--ink)">
    <main class="flex-1 flex items-center justify-center px-6 lg:px-14 py-10">
      <div class="w-full max-w-2xl">

        <p class="font-mono text-xs tracking-[0.14em] uppercase" style="color: var(--muted)">
          Error · {{ code }}
        </p>

        <h1 class="font-display mt-4 text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight" style="font-weight: 400">
          {{ titulo }}<em class="italic" style="font-weight: 300">.</em>
        </h1>

        <p class="mt-6 text-base max-w-md leading-relaxed" style="color: var(--muted)">
          {{ subtitulo }}
        </p>

        <div class="mt-10 flex flex-wrap gap-3">
          <button @click="volverInicio" class="btn-primary flex items-center gap-2">
            <span>Volver al inicio</span>
            <span class="font-mono text-sm">→</span>
          </button>
          <NuxtLink to="/login" class="btn-ghost flex items-center gap-2 text-sm">
            <span class="font-mono">←</span>
            <span>Ir a inicio de sesión</span>
          </NuxtLink>
        </div>

        <div class="mt-16 pt-6 border-t" style="border-color: var(--border)">
          <p class="font-mono text-[11px] tracking-[0.1em] uppercase" style="color: var(--muted)">
            PIA-IA · Secretaría de Salud
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
