<script setup lang="ts">
// Redirige según sesión activa
const router = useRouter()

onMounted(() => {
  const curp = localStorage.getItem('curp')
  router.replace(curp ? '/dashboard' : '/login')
})
</script>

<template>
  <div class="min-h-screen bg-white flex items-center justify-center">
    <p class="text-xs text-gray-300 uppercase tracking-widest font-medium">Cargando…</p>
  </div>
</template>