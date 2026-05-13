<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  open: boolean
  curp: string
  userName?: string
}>()

const emit = defineEmits<{
  (e: 'aceptado'): void
}>()

const acepto = ref(false)
const cargando = ref(false)
const errorMsg = ref('')

async function confirmar() {
  if (!acepto.value) {
    errorMsg.value = 'Debes marcar la casilla para continuar.'
    return
  }
  cargando.value = true
  errorMsg.value = ''
  try {
    const api = useApi()
    await api.aceptarTerminos(props.curp)
    useSession().marcarTerminosAceptados()
    emit('aceptado')
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'No se pudo registrar el consentimiento.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <Modal :open="open" :dismissible="false" max-width="40rem" title="Consentimiento informado">
    <p class="eyebrow mb-3">PIA-IA / AVISO DE PRIVACIDAD</p>
    <div class="text-sm space-y-3" style="color: var(--ink); line-height: 1.7">
      <p>
        Hola {{ userName || 'ciudadano' }}. Para usar PIA-IA necesitamos tu autorizacion expresa
        para procesar la informacion de tu cartilla de vacunacion bajo la Ley Federal de Proteccion
        de Datos Personales en Posesion de los Particulares (LFPDPPP).
      </p>
      <ol class="list-decimal pl-5 space-y-1">
        <li>Tus datos (CURP, NSS, vacunas aplicadas, alergias) se usan solo para gestionar tu esquema y para alertas personalizadas.</li>
        <li>Personal de salud autorizado puede consultar y registrar dosis en tu cartilla; cada acceso queda registrado en una bitacora de auditoria.</li>
        <li>No compartimos tus datos con terceros sin tu consentimiento adicional.</li>
        <li>Tienes derecho a acceder, rectificar, cancelar u oponerte (ARCO) al tratamiento de tus datos en cualquier momento.</li>
        <li>El sistema usa encriptacion en transito y hash bcrypt para tus contrasenas.</li>
      </ol>
      <p>
        Al aceptar autorizas el tratamiento descrito.
      </p>
    </div>

    <label class="flex items-start gap-2 mt-5 cursor-pointer text-sm">
      <input v-model="acepto" type="checkbox" class="mt-1" />
      <span>He leido el aviso de privacidad y autorizo el tratamiento de mis datos para los fines descritos.</span>
    </label>

    <p v-if="errorMsg" class="text-xs mt-3" style="color: var(--wine)">{{ errorMsg }}</p>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs" style="color: var(--muted)">
          Tu consentimiento queda registrado con fecha y hora.
        </span>
        <button
          type="button"
          class="btn-primary"
          :disabled="cargando"
          @click="confirmar"
        >
          {{ cargando ? 'Registrando...' : 'Acepto y continuo' }}
        </button>
      </div>
    </template>
  </Modal>
</template>
