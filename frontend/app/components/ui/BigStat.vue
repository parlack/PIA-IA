<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  hint?: string
  highlight?: 'normal' | 'wine' | 'ochre' | 'moss'
}>()
</script>

<template>
  <div>
    <p class="eyebrow">{{ label }}</p>
    <p
      class="font-display text-5xl lg:text-6xl mt-2 tabular"
      style="font-weight: 400"
      :style="highlight === 'wine' ? 'color: var(--wine)' : highlight === 'ochre' ? 'color: var(--ochre)' : highlight === 'moss' ? 'color: var(--moss)' : ''"
    >
      {{ value }}
      <slot name="suffix" />
    </p>
    <p v-if="hint" class="text-xs mt-1" style="color: var(--muted)">{{ hint }}</p>
    <slot />
  </div>
</template>
