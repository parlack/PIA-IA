/**
 * Facade central. Mantiene la firma original para no romper paginas existentes.
 * La logica esta separada en clientes de dominio dentro de composables/api/*.
 */
import type {
  UsuarioPublico,
  UsuarioUpdatePayload,
  AdminCrearUsuarioPayload,
  UsuarioListadoAdmin,
  HistorialResponse,
  VacunaCatalogo,
  AlertasResponse,
  RegistrarDosisPayload,
  Mensaje,
  EnviarMensajePayload,
  AdminStats,
  UnidadMedica,
} from '~/types'

export const useApi = () => {
  const http = useHttp()

  return {
    // Auth
    login: (curp: string, contrasena?: string) =>
      http.post('/auth/login', { curp, contrasena }),

    setPassword: (curp: string, contrasena: string) =>
      http.post('/auth/set-password', { curp, contrasena }),

    // Usuario
    getUsuario: (curp: string) =>
      http.get<UsuarioPublico>(`/usuarios/${curp}`),

    updateUsuario: (curp: string, data: UsuarioUpdatePayload) =>
      http.patch(`/usuarios/${curp}`, data),

    // Vacunas
    getHistorial: (curp: string) =>
      http.get<HistorialResponse>(`/usuarios/${curp}/vacunas`),

    registrarDosis: (data: RegistrarDosisPayload) =>
      http.post('/vacunas/historial', data),

    updateDosis: (id: number, data: Record<string, unknown>) =>
      http.patch(`/vacunas/historial/${id}`, data),

    deleteDosis: (id: number) =>
      http.delete(`/vacunas/historial/${id}`),

    getCatalogo: () =>
      http.get<VacunaCatalogo[]>('/vacunas/catalogo'),

    crearVacunaCatalogo: (data: Partial<VacunaCatalogo>) =>
      http.post('/vacunas/catalogo', data),

    updateVacunaCatalogo: (id: number, data: Partial<VacunaCatalogo>) =>
      http.patch(`/vacunas/catalogo/${id}`, data),

    deleteVacunaCatalogo: (id: number) =>
      http.delete(`/vacunas/catalogo/${id}`),

    // Buzon
    getMensajes: (curp: string) =>
      http.get<Mensaje[]>(`/buzon/${curp}`),

    enviarMensaje: (data: EnviarMensajePayload) =>
      http.post('/buzon', data),

    marcarLeido: (id: number) =>
      http.patch(`/buzon/${id}/leer`, {}),

    deleteMensaje: (id: number) =>
      http.delete(`/buzon/${id}`),

    // Admin
    adminGetUsuarios: (params?: { rol?: string; search?: string; unidad_medica_id?: number }) => {
      const sp = new URLSearchParams()
      if (params?.rol) sp.set('rol', params.rol)
      if (params?.search) sp.set('search', params.search)
      if (params?.unidad_medica_id != null) sp.set('unidad_medica_id', String(params.unidad_medica_id))
      const qs = sp.toString()
      return http.get<UsuarioListadoAdmin[]>(`/admin/usuarios${qs ? '?' + qs : ''}`)
    },

    adminCrearUsuario: (data: AdminCrearUsuarioPayload) =>
      http.post('/admin/usuarios', data),

    adminDeleteUsuario: (curp: string) =>
      http.delete(`/admin/usuarios/${curp}`),

    adminGetStats: () =>
      http.get<AdminStats>('/admin/stats'),

    adminGetVacunasUsuario: (curp: string) =>
      http.get<HistorialResponse>(`/admin/usuarios/${curp}/vacunas`),

    // Alertas
    getAlertas: (curp: string) =>
      http.get<AlertasResponse>(`/alertas/${curp}`),

    // Unidades
    getUnidades: () =>
      http.get<UnidadMedica[]>('/unidades'),

    // Auth extras
    aceptarTerminos: (curp: string) =>
      http.post('/auth/aceptar-terminos', { curp }),

    // Certificados / QR
    getQrToken: (curp: string) =>
      http.get<{ token: string; expira_en: number }>(`/certificados/${curp}/qr-token`),
    descargarCartillaUrl: (curp: string) =>
      `${http.BASE_URL}/certificados/${curp}/pdf`,
    verificarQr: (token: string) =>
      http.get<{ valido: boolean; usuario?: any; resumen?: any[]; total_dosis?: number }>(
        `/certificados/verificar/${token}`,
      ),
    aplicarDosisPorQr: (data: {
      token: string
      vacuna_id: number
      numero_dosis: number
      fecha_aplicacion: string
      lugar_aplicacion?: string
      lote?: string
      actor_curp: string
    }) => http.post<{ ok: boolean; id: number; usuario: any }>('/certificados/aplicar-por-token', data),

    // Alergias y contraindicaciones
    getAlergias: (curp: string) =>
      http.get<{ alergias: any[]; contraindicaciones: any[] }>(`/alergias/${curp}`),
    crearAlergia: (data: { curp: string; sustancia: string; severidad: string; observaciones?: string }) =>
      http.post('/alergias', data),
    deleteAlergia: (id: number) =>
      http.delete(`/alergias/${id}`),
    crearContraindicacion: (data: { curp: string; descripcion: string; vacuna_id?: number; permanente?: boolean }) =>
      http.post('/alergias/contraindicaciones', data),
    deleteContraindicacion: (id: number) =>
      http.delete(`/alergias/contraindicaciones/${id}`),

    // AEFI
    getAefiUsuario: (curp: string) =>
      http.get<any[]>(`/aefi/usuario/${curp}`),
    getAefiDosisReportables: (curp: string) =>
      http.get<{ ventana_dias: number; dosis: any[] }>(`/aefi/usuario/${curp}/dosis-reportables`),
    listarAefi: (params?: { severidad?: string; limit?: number }) => {
      const sp = new URLSearchParams()
      if (params?.severidad) sp.set('severidad', params.severidad)
      if (params?.limit) sp.set('limit', String(params.limit))
      const qs = sp.toString()
      return http.get<any[]>(`/aefi${qs ? '?' + qs : ''}`)
    },
    reportarAefi: (data: { dosis_id: number; sintomas: string; severidad: string; inicio_minutos?: number; requiere_seguimiento?: boolean }) =>
      http.post('/aefi', data),

    // Cuidadores
    getDependientes: (curp: string) =>
      http.get<any[]>(`/cuidadores/${curp}`),
    agregarDependiente: (data: { curp_cuidador: string; curp_dependiente: string; relacion: string }) =>
      http.post('/cuidadores', data),
    eliminarDependiente: (id: number) =>
      http.delete(`/cuidadores/${id}`),

    // Citas
    getCitasUsuario: (curp: string) =>
      http.get<any[]>(`/citas/usuario/${curp}`),
    crearCita: (data: { curp_usuario: string; vacuna_id: number; unidad_medica_id: number; fecha_hora: string; notas?: string }) =>
      http.post('/citas', data),
    actualizarCita: (id: number, estado: string) =>
      http.patch(`/citas/${id}`, { estado }),
    eliminarCita: (id: number) =>
      http.delete(`/citas/${id}`),

    // Reportes / BI
    reporteCoberturaEstado: () =>
      http.get<any[]>('/reportes/cobertura/estado'),
    reporteCoberturaUnidad: () =>
      http.get<any[]>('/reportes/cobertura/unidad'),
    reporteCoberturaGrupo: () =>
      http.get<any[]>('/reportes/cobertura/grupo'),
    reporteVacunasPorMes: (meses = 12) =>
      http.get<any[]>(`/reportes/vacunas-por-mes?meses=${meses}`),
    reporteCoberturaVacuna: () =>
      http.get<any[]>('/reportes/cobertura/vacuna'),
    reporteCallRecall: (dias = 30) =>
      http.get<any[]>(`/reportes/call-recall?dias=${dias}`),

    // Auditoria
    listarAuditoria: (params?: { actor?: string; accion?: string; limit?: number }) => {
      const sp = new URLSearchParams()
      if (params?.actor) sp.set('actor', params.actor)
      if (params?.accion) sp.set('accion', params.accion)
      if (params?.limit) sp.set('limit', String(params.limit))
      const qs = sp.toString()
      return http.get<any[]>(`/auditoria${qs ? '?' + qs : ''}`)
    },

    // Push
    registrarPushToken: (curp: string, token: string) =>
      http.post('/push/token', { curp, token }),
    pushBroadcast: (data: { curps: string[]; titulo: string; cuerpo: string }) =>
      http.post('/push/broadcast', data),
    dispararCallRecall: (dias = 30) =>
      http.post(`/push/call-recall?dias=${dias}`, {}),
  }
}
