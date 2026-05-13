<script setup lang="ts">
import type { UsuarioMe } from '~/composables/useDashboardData'

const props = defineProps<{
  usuario: UsuarioMe | null
}>()

const { t } = useI18n()

const unidadLinea = computed(() => {
  const u = props.usuario
  if (!u?.unidad_nombre) return '—'
  const loc = [u.ciudad, u.estado].filter(Boolean).join(', ')
  return loc ? `${u.unidad_nombre} — ${loc}` : u.unidad_nombre
})
</script>

<template>
  <section v-if="usuario" class="mb-10">
    <div class="border-b pb-2 mb-5" style="border-color: var(--ink)">
      <h2 class="font-display text-2xl" style="font-weight: 500">
        {{ t('dashboard.medicalUnit') }}
      </h2>
    </div>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
      <div>
        <dt class="eyebrow">{{ t('dashboard.unit') }}</dt>
        <dd class="mt-1.5 text-base" style="font-weight: 500">{{ unidadLinea }}</dd>
      </div>
      <div>
        <dt class="eyebrow">{{ t('dashboard.phone') }}</dt>
        <dd class="mt-1.5 text-base font-mono tabular" style="font-weight: 400">
          {{ usuario.unidad_telefono || '—' }}
        </dd>
      </div>
      <div>
        <dt class="eyebrow">Medico familiar</dt>
        <dd class="mt-1.5 text-base" style="font-weight: 500">
          {{ usuario.medico_familiar || '—' }}
        </dd>
      </div>
      <div>
        <dt class="eyebrow">No. Seguridad Social</dt>
        <dd class="mt-1.5 text-base font-mono tabular" style="font-weight: 400">
          {{ usuario.nss || '—' }}
        </dd>
      </div>
    </dl>
  </section>
</template>
