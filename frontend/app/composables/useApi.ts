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
  }
}
