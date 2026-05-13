<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

type Unidad = {
  id: number
  nombre: string
  estado: string
  ciudad: string
  direccion?: string | null
  telefono?: string | null
  lat?: number | null
  lng?: number | null
  dosis?: number
  usuarios?: number
}

const props = defineProps<{
  unidades: Unidad[]
  altura?: string
}>()

const mapRef = ref<HTMLDivElement | null>(null)
const seleccionada = ref<Unidad | null>(null)
let mapInstance: any = null
let leafletLib: any = null
let markersGroup: any = null
let cssAdded = false

async function loadLeaflet() {
  if (typeof window === 'undefined') return null
  if ((window as any).L) {
    leafletLib = (window as any).L
    return leafletLib
  }
  if (!cssAdded) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    cssAdded = true
  }
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se pudo cargar Leaflet'))
    document.head.appendChild(s)
  })
  leafletLib = (window as any).L
  return leafletLib
}

async function pintarMapa() {
  if (!mapRef.value) return
  const L = await loadLeaflet()
  if (!L || !mapRef.value) return

  const conGeo = props.unidades.filter(u => u.lat != null && u.lng != null) as Required<Unidad>[]

  if (!mapInstance) {
    mapInstance = L.map(mapRef.value, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([23.5, -102], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(mapInstance)
  }

  if (markersGroup) markersGroup.remove()
  markersGroup = L.layerGroup().addTo(mapInstance)

  if (!conGeo.length) return

  const icon = L.divIcon({
    className: 'pia-marker',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#0E5037;border:2px solid #F5F1E8;box-shadow:0 0 0 1px #0E5037"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

  conGeo.forEach((u) => {
    const m = L.marker([u.lat as number, u.lng as number], { icon }).addTo(markersGroup)
    m.bindTooltip(`${u.nombre}`, { permanent: false, direction: 'top' })
    m.on('click', () => {
      seleccionada.value = u
    })
  })

  const group = L.featureGroup(markersGroup.getLayers())
  if (group.getLayers().length) {
    mapInstance.fitBounds(group.getBounds().pad(0.2))
  }
}

onMounted(() => {
  pintarMapa()
})

watch(() => props.unidades, () => pintarMapa(), { deep: true })

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div>
    <div ref="mapRef" :style="`height: ${altura || '420px'}; background: var(--bone)`"></div>
    <div v-if="seleccionada" class="mt-4 p-4" style="background: var(--paper); border: 1px solid var(--border)">
      <p class="eyebrow">Unidad seleccionada</p>
      <h3 class="font-display text-xl mt-1" style="font-weight: 500">{{ seleccionada.nombre }}</h3>
      <p class="text-sm mt-2" style="color: var(--ink)">
        {{ seleccionada.direccion || `${seleccionada.ciudad}, ${seleccionada.estado}` }}
      </p>
      <p v-if="seleccionada.telefono" class="text-sm font-mono mt-1" style="color: var(--muted)">
        {{ seleccionada.telefono }}
      </p>
      <p v-if="seleccionada.dosis != null || seleccionada.usuarios != null" class="text-xs mt-2 font-mono tabular" style="color: var(--muted)">
        {{ seleccionada.usuarios || 0 }} usuarios · {{ seleccionada.dosis || 0 }} dosis aplicadas
      </p>
    </div>
  </div>
</template>

<style>
.pia-marker {
  cursor: pointer;
}
.leaflet-container {
  font-family: 'IBM Plex Sans', system-ui, sans-serif !important;
}
.leaflet-tooltip {
  background: var(--paper);
  border: 1px solid var(--ink);
  color: var(--ink);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  border-radius: 0;
  box-shadow: none;
}
.leaflet-tooltip-top:before {
  border-top-color: var(--ink);
}
</style>
