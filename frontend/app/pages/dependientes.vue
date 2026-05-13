<script setup lang="ts">
definePageMeta({ middleware: 'ciudadano' })
useHead({ title: 'Dependientes' })

const { t } = useI18n()
const router = useRouter()
const {
  curp,
  resumen,
  usuario,
  isAuthed,
} = useDashboardData()

onMounted(() => {
  if (typeof localStorage !== 'undefined' && !isAuthed()) {
    router.replace('/dashboard')
  }
})
</script>

<template>
  <DashboardShell>
    <HeroExpediente
      :usuario="usuario"
      :curp="curp"
      :has-resumen="resumen.length > 0"
      :titulo="t('dependientes.title')"
      :titulo-italic="t('dependientes.titleItalic')"
      :eyebrow="t('dependientes.eyebrow')"
    />

    <DependientesSection v-if="isAuthed()" :curp="curp" />

    <div v-else class="py-12 text-center">
      <p class="font-display text-xl italic" style="color: var(--muted); font-weight: 300">
        {{ t('dependientes.requiresAuth') }}
      </p>
    </div>
  </DashboardShell>
</template>
