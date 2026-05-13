<script setup lang="ts">
import type { UsuarioMe } from '~/composables/useDashboardData'

const props = defineProps<{
  usuario: UsuarioMe | null
  curp: string
  hasResumen: boolean
  /** Si es true se muestra el subtitulo grande (uso en /dashboard). */
  large?: boolean
  /** Eyebrow opcional override. Por defecto: fecha de hoy. */
  eyebrow?: string
  /** Titulo opcional override. Por defecto: "Tu cartilla digital". */
  titulo?: string
  /** Linea italica opcional override. */
  tituloItalic?: string
  /** Mostrar acciones (QR / PDF / Imprimir). */
  showActions?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-qr'): void
  (e: 'download-pdf'): void
  (e: 'print'): void
}>()

const { t } = useI18n()

const grupoLabel: Record<string, string> = {
  adulto_mayor:   'Adulto mayor',
  embarazada:     'Embarazada',
  personal_salud: 'Personal de salud',
  cronico:        'Cronico',
}

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)
</script>

<template>
  <header
    class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-8 mb-10 border-b-2"
    style="border-color: var(--ink)"
  >
    <div>
      <p class="eyebrow">{{ eyebrow ?? fechaHoy }}</p>
      <h1
        class="font-display mt-3 leading-[1] tracking-tight"
        :class="large ? 'text-4xl sm:text-5xl lg:text-[56px]' : 'text-3xl sm:text-4xl'"
        style="font-weight: 400"
      >
        {{ titulo ?? t('login.title') }}<br />
        <em style="font-weight: 400" class="italic">{{ tituloItalic ?? t('login.titleItalic') }}</em>
      </h1>
      <p v-if="usuario" class="mt-4 text-sm" style="color: var(--muted)">
        {{ usuario.nombre }} {{ usuario.apellido_paterno }}
        <span
          v-if="usuario.grupo_prioritario && usuario.grupo_prioritario !== 'ninguno'"
          class="ml-2 inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
          style="background: var(--moss-soft); color: var(--moss-dark); letter-spacing: 0.1em"
        >
          {{ grupoLabel[usuario.grupo_prioritario] || usuario.grupo_prioritario }}
        </span>
      </p>
    </div>

    <div class="flex flex-col items-start lg:items-end gap-3.5">
      <!-- Linea 1: identidad (CURP + idioma) -->
      <div class="flex items-center gap-4 flex-wrap">
        <p
          v-if="curp"
          class="font-mono text-[11px] px-2.5 py-1"
          style="background: var(--bone); letter-spacing: 0.08em"
        >
          {{ curp }}
        </p>
        <LanguageSwitcher />
      </div>

      <!-- Linea 2: acciones del expediente -->
      <div v-if="showActions" class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="hero-action hero-action--primary"
          @click="emit('open-qr')"
        >
          <span class="hero-action__icon">▣</span>
          <span class="hero-action__label">{{ t('dashboard.actions.myQr') }}</span>
        </button>
        <button
          v-if="hasResumen"
          type="button"
          class="hero-action"
          @click="emit('download-pdf')"
        >
          <span class="hero-action__icon">↓</span>
          <span class="hero-action__label">{{ t('dashboard.actions.downloadPdf') }}</span>
        </button>
        <button
          v-if="hasResumen"
          type="button"
          class="hero-action"
          @click="emit('print')"
        >
          <span class="hero-action__icon">⎙</span>
          <span class="hero-action__label">{{ t('dashboard.actions.print') }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  border: 1px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.hero-action:hover {
  background: var(--ink);
  color: var(--paper);
  transform: translateY(-1px);
}
.hero-action__icon {
  display: inline-flex;
  font-size: 13px;
  line-height: 1;
}
.hero-action__label {
  line-height: 1;
}

.hero-action--primary {
  background: var(--ink);
  color: var(--paper);
}
.hero-action--primary:hover {
  background: var(--moss-dark);
  border-color: var(--moss-dark);
}
</style>
