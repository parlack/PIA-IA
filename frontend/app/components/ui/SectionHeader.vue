<script setup lang="ts">
defineProps<{
  title: string
  eyebrow?: string
  rule?: boolean
}>()
</script>

<template>
  <div :class="rule !== false ? 'border-b pb-2 mb-5' : 'mb-5'" style="border-color: var(--ink)">
    <p v-if="eyebrow" class="eyebrow mb-1">{{ eyebrow }}</p>
    <div class="flex items-baseline justify-between gap-3 flex-wrap">
      <h2 class="font-display text-2xl" style="font-weight: 500">{{ title }}</h2>
      <slot name="aside" />
    </div>
  </div>
</template>
