/**
 * Estado global compartido para el expediente del usuario actual.
 *
 * Centraliza:
 * - Datos del usuario (perfil)
 * - Resumen e historial de vacunas
 * - Alertas pendientes
 * - Mensajes del buzon
 *
 * Las paginas /dashboard, /vacunas, /mensajes, etc. consumen este composable
 * en lugar de pegarle al backend individualmente. Asi se evita refetch al
 * navegar entre secciones.
 */

export type ResumenRow = {
  vacuna_id: number
  nombre: string
  dosis_total: number
  dosis_aplicadas: number
  completa: boolean
  ultima_fecha: string | null
}

export type MensajeRow = {
  id: number
  titulo: string
  contenido: string
  tipo: string
  leido: number
  enviado_en: string
  leido_en: string | null
  remitente_nombre: string
  remitente_apellido: string
}

export type UsuarioMe = {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  celular: string | null
  correo: string | null
  nss: string | null
  medico_familiar: string | null
  unidad_nombre: string | null
  unidad_telefono: string | null
  ciudad: string | null
  estado: string | null
  grupo_prioritario: string | null
  fecha_nacimiento: string | null
  sexo: string | null
}

export type AlertaRow = {
  vacuna_id: number
  nombre: string
  dosis_faltantes: number
  dosis_total: number
  dosis_aplicadas: number
  prioridad: 'alta' | 'normal'
}

export const useDashboardData = () => {
  const api = useApi()
  const session = useSession()

  const curp = useState<string>('pia.dashboard.curp', () => '')
  const loading = useState<boolean>('pia.dashboard.loading', () => true)
  const loaded = useState<boolean>('pia.dashboard.loaded', () => false)
  const loadError = useState<string>('pia.dashboard.error', () => '')

  const resumen = useState<ResumenRow[]>('pia.dashboard.resumen', () => [])
  const historialDetalle = useState<any[]>('pia.dashboard.historial', () => [])
  const mensajes = useState<MensajeRow[]>('pia.dashboard.mensajes', () => [])
  const usuario = useState<UsuarioMe | null>('pia.dashboard.usuario', () => null)
  const alertas = useState<AlertaRow[]>('pia.dashboard.alertas', () => [])

  const isBasicSession = useState<boolean>('pia.dashboard.basic', () => false)
  const isNoRegistrado = useState<boolean>('pia.dashboard.noregis', () => false)

  const completadas = computed(() => resumen.value.filter(v => v.completa).length)
  const porcentaje = computed(() =>
    resumen.value.length ? Math.round((completadas.value / resumen.value.length) * 100) : 0
  )
  const pendientes = computed(() => resumen.value.filter(v => !v.completa))
  const noLeidos = computed(() => mensajes.value.filter(m => !m.leido).length)
  const alertasAlta = computed(() => alertas.value.filter(a => a.prioridad === 'alta'))

  function isAuthed() {
    return typeof localStorage !== 'undefined' && localStorage.getItem('auth') === 'true'
  }

  async function cargar(forzar = false): Promise<void> {
    const curpActual = session.getCurp() || ''

    // Si el CURP cambio (logout + nuevo login), forzamos recarga.
    if (curpActual !== curp.value) {
      loaded.value = false
    }

    if (loaded.value && !forzar) return

    curp.value = curpActual
    isBasicSession.value = session.isBasicSession()
    isNoRegistrado.value = session.isNoRegistrado()

    if (isNoRegistrado.value) {
      loading.value = false
      loaded.value = true
      return
    }

    if (!curp.value) {
      loadError.value = 'No hay sesion activa.'
      loading.value = false
      loaded.value = true
      return
    }

    loading.value = true
    loadError.value = ''
    try {
      const [hist, user, msg, alert] = await Promise.all([
        api.getHistorial(curp.value) as Promise<{ resumen: ResumenRow[]; historial: any[] }>,
        api.getUsuario(curp.value) as Promise<UsuarioMe>,
        api.getMensajes(curp.value) as Promise<MensajeRow[]>,
        api.getAlertas(curp.value).catch(() => ({ alertas: [] })) as Promise<{ alertas: AlertaRow[] }>,
      ])
      resumen.value = hist.resumen || []
      historialDetalle.value = hist.historial || []
      usuario.value = user
      mensajes.value = Array.isArray(msg) ? msg : []
      alertas.value = alert.alertas || []
      loaded.value = true
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Error al cargar el expediente.'
    } finally {
      loading.value = false
    }
  }

  function invalidar() {
    loaded.value = false
  }

  function eliminarMensajeLocal(id: number) {
    mensajes.value = mensajes.value.filter(m => m.id !== id)
  }

  function marcarLeidoLocal(id: number) {
    const m = mensajes.value.find(x => x.id === id)
    if (m) m.leido = 1
  }

  return {
    curp,
    loading,
    loaded,
    loadError,
    resumen,
    historialDetalle,
    mensajes,
    usuario,
    alertas,
    isBasicSession,
    isNoRegistrado,
    completadas,
    porcentaje,
    pendientes,
    noLeidos,
    alertasAlta,
    isAuthed,
    cargar,
    invalidar,
    eliminarMensajeLocal,
    marcarLeidoLocal,
  }
}
