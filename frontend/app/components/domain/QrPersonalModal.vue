<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Swal from 'sweetalert2'

const props = defineProps<{
  open: boolean
  curp: string
  nombre?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const qrCache = useQrCache()
const http = useHttp()

const token = ref<string | null>(null)
const qrSrc = ref<string | null>(null)
const expiraEn = ref<number | null>(null)
const cargando = ref(false)
const guardando = ref(false)
const errorMsg = ref('')
const desdeCache = ref(false)

const tiempoRestante = computed(() => {
  if (!expiraEn.value) return ''
  const ms = expiraEn.value - Date.now()
  if (ms <= 0) return 'caducado'
  const totalMin = Math.floor(ms / 60000)
  const horas = Math.floor(totalMin / 60)
  const minutos = totalMin % 60
  if (horas > 0) return `${horas}h ${minutos}m`
  return `${minutos}m`
})

function buildQrSrc(tokenValue: string): string {
  const payload = `${window.location.origin}/verificar/${tokenValue}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(payload)}&color=0E5037&bgcolor=F5F1E8`
}

async function cargarToken(forzar = false) {
  if (!forzar) {
    const cached = qrCache.leer(props.curp)
    if (cached) {
      token.value = cached.token
      qrSrc.value = cached.qrSrc
      expiraEn.value = cached.expiraEn
      desdeCache.value = true
      return
    }
  }

  cargando.value = true
  errorMsg.value = ''
  desdeCache.value = false
  try {
    const qs = forzar ? '?regenerar=true' : ''
    const res = await http.get<{ token: string; expira_en: number; expira_en_iso?: string }>(
      `/certificados/${props.curp}/qr-token${qs}`,
    )
    token.value = res.token
    const src = buildQrSrc(res.token)
    qrSrc.value = src
    const entry = qrCache.guardar(props.curp, res.token, src)
    expiraEn.value = entry.expiraEn
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'No se pudo generar el QR.'
  } finally {
    cargando.value = false
  }
}

function regenerar() {
  qrCache.invalidar(props.curp)
  cargarToken(true)
}

async function descargarImagen() {
  if (!qrSrc.value || !token.value) return
  guardando.value = true
  try {
    const resp = await fetch(qrSrc.value)
    if (!resp.ok) throw new Error('No se pudo descargar la imagen del QR.')
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pia-qr-${props.curp.toUpperCase()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e: any) {
    await Swal.fire({
      icon: 'error',
      title: 'No se pudo guardar la imagen',
      text: e?.message ?? 'Intenta de nuevo.',
      confirmButtonColor: '#0E5037',
    })
  } finally {
    guardando.value = false
  }
}

watch(() => props.open, (v) => {
  if (v) {
    cargarToken()
  }
})
</script>

<template>
  <Modal :open="open" max-width="28rem" title="Tu QR personal" @close="emit('close')">
    <p class="eyebrow mb-3">PIA-IA / VERIFICACION</p>
    <p class="text-sm mb-5" style="color: var(--ink)">
      Muestra este codigo al personal de salud para que pueda registrar dosis sin teclear tu CURP.
      Caduca en 24 horas.
    </p>

    <div class="flex items-center justify-center py-4">
      <div v-if="cargando" class="text-center py-12">
        <p class="font-mono text-xs uppercase tracking-wider" style="color: var(--muted)">
          Generando...
        </p>
      </div>
      <div v-else-if="errorMsg" class="text-center py-8">
        <p class="text-sm" style="color: var(--wine)">{{ errorMsg }}</p>
      </div>
      <img
        v-else-if="qrSrc"
        :src="qrSrc"
        alt="QR personal"
        class="w-72 h-72 object-contain"
        style="border: 1px solid var(--border)"
      />
    </div>

    <div class="mt-3 flex items-center justify-between gap-3 flex-wrap">
      <p
        v-if="qrSrc"
        class="font-mono text-[10px] uppercase tracking-wider"
        style="color: var(--muted); letter-spacing: 0.12em"
      >
        <span v-if="desdeCache">guardado · </span>
        <span>vence en {{ tiempoRestante }}</span>
      </p>
      <div v-if="qrSrc" class="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          class="qr-link"
          :disabled="guardando"
          @click="descargarImagen"
        >
          <span>↓</span>
          <span>{{ guardando ? 'guardando…' : 'guardar imagen' }}</span>
        </button>
        <button
          type="button"
          class="qr-link"
          :disabled="cargando"
          @click="regenerar"
        >
          <span>↻</span>
          <span>regenerar</span>
        </button>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="text-xs" style="color: var(--muted)">
          QR vinculado a CURP <span class="font-mono">{{ curp }}</span>.
        </div>
        <button
          type="button"
          class="qr-close"
          @click="emit('close')"
        >
          <span>Cerrar</span>
          <span>✕</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.qr-close {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.qr-close:hover {
  background: var(--moss-dark);
  border-color: var(--moss-dark);
}

.qr-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--moss-dark);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 4px 0;
  transition: opacity 0.15s ease;
}
.qr-link:hover {
  opacity: 0.7;
}
.qr-link:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
