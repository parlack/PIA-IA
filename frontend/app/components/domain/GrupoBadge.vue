<script setup lang="ts">
import { etiquetaGrupo } from '~/constants/grupos'
import type { GrupoPrioritario } from '~/types'

defineProps<{
  grupo: GrupoPrioritario | string | null | undefined
  small?: boolean
}>()
</script>

<template>
  <span
    v-if="grupo && grupo !== 'ninguno'"
    class="inline-flex items-center font-mono uppercase tracking-wider"
    :class="small ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'"
    style="background: var(--moss-soft); color: var(--moss-dark); letter-spacing: 0.1em"
  >
    {{ etiquetaGrupo(grupo) }}
  </span>
</template>
