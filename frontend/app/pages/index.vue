<script setup lang="ts">
import { esRolAdmin, normalizarRolParaStorage } from '~/utils/rol'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Cargando' })

const router = useRouter()

onMounted(() => {
  const curp = localStorage.getItem('curp')
  if (!curp) {
    router.replace('/login')
    return
  }
  const rol = normalizarRolParaStorage(localStorage.getItem('rol'))
  router.replace(esRolAdmin(rol) ? '/admin' : '/dashboard')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center" style="background: var(--paper)">
    <div class="text-center">
      <p class="eyebrow" style="color: var(--muted)">Cargando</p>
      <div class="mt-4 mx-auto w-3.5 h-3.5 border-[1.5px] rounded-full animate-spin"
        style="border-color: var(--ink); border-top-color: transparent" />
    </div>
  </div>
</template>
