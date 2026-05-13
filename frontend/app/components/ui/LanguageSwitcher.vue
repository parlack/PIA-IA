<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const { locale, setLocale, locales } = useI18n()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function elegir(code: 'es' | 'yua' | 'nah') {
  setLocale(code)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="relative inline-flex">
    <button
      type="button"
      class="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider hover:opacity-100"
      :class="open ? 'opacity-100' : 'opacity-70'"
      style="letter-spacing: 0.16em"
      @click="toggle"
    >
      <span aria-hidden="true">{{ locale.toUpperCase() }}</span>
      <span class="text-[8px]" :class="open ? 'rotate-180' : ''" style="transition: transform .15s">▾</span>
    </button>

    <div
      v-if="open"
      class="lang-menu absolute right-0 top-full mt-2 z-30 min-w-[200px] py-1.5 shadow-md"
      role="listbox"
    >
      <button
        v-for="loc in locales"
        :key="loc.code"
        type="button"
        role="option"
        :aria-selected="locale === loc.code"
        class="lang-option w-full text-left px-3 py-2 text-sm flex items-baseline justify-between gap-2 transition-colors"
        :class="{ 'is-active': locale === loc.code }"
        @click="elegir(loc.code)"
      >
        <span>{{ loc.nativeName }}</span>
        <span class="font-mono text-[10px] opacity-60">{{ loc.code }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.lang-menu {
  background: var(--paper);
  border: 1px solid var(--ink);
  color: var(--ink);
}
.lang-option {
  color: var(--ink);
  font-weight: 400;
}
.lang-option:hover {
  background: var(--bone);
}
.lang-option.is-active {
  background: var(--bone);
  font-weight: 500;
}
</style>
