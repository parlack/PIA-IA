import { apiClient } from './client'
import type {
  AdminStats,
  UsuarioAdminRow,
  UnidadMedica,
  CatalogoVacunaRow,
  CoberturaUnidad,
  CoberturaEstado,
  CoberturaGrupo,
  CoberturaVacuna,
  CallRecallCandidato,
  AefiReporte,
  AuditoriaEvento,
  MensajeRow,
} from '@/types/admin'
import type { HistorialResponse } from '@/types'

export interface AdminCrearUsuarioPayload {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  correo?: string
  celular?: string
  rol?: string
  grupo_prioritario?: string
  unidad_medica_id?: number
}

export interface CrearVacunaCatalogoPayload {
  nombre: string
  enfermedad: string
  dosis_descripcion?: string
  dosis_total: number
}

export interface EnviarMensajePayload {
  destinatario_curp: string
  titulo: string
  contenido: string
  tipo?: 'informacion' | 'advertencia' | 'urgente'
  remitente_curp?: string
}

export interface RegistrarDosisPayload {
  curp_usuario: string
  vacuna_id: number
  numero_dosis: number
  fecha_aplicacion: string
  lugar_aplicacion?: string
  lote?: string
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? '?' + s : ''
}

export const adminApi = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats'),

  listarUsuarios: (params?: { rol?: string; search?: string; unidad_medica_id?: number }) =>
    apiClient.get<UsuarioAdminRow[]>(`/admin/usuarios${qs(params || {})}`),

  crearUsuario: (data: AdminCrearUsuarioPayload) =>
    apiClient.post<{ ok: boolean; curp: string }>('/admin/usuarios', data),

  eliminarUsuario: (curp: string) =>
    apiClient.delete<{ ok: boolean }>(`/admin/usuarios/${curp}`),

  getVacunasUsuario: (curp: string) =>
    apiClient.get<HistorialResponse>(`/admin/usuarios/${curp}/vacunas`),

  listarUnidades: () =>
    apiClient.get<UnidadMedica[]>('/unidades'),

  listarCatalogo: () =>
    apiClient.get<CatalogoVacunaRow[]>('/vacunas/catalogo'),

  crearCatalogo: (data: CrearVacunaCatalogoPayload) =>
    apiClient.post<{ ok: boolean; id: number }>('/vacunas/catalogo', data),

  actualizarCatalogo: (id: number, data: Partial<CrearVacunaCatalogoPayload>) =>
    apiClient.patch<{ ok: boolean }>(`/vacunas/catalogo/${id}`, data),

  eliminarCatalogo: (id: number) =>
    apiClient.delete<{ ok: boolean }>(`/vacunas/catalogo/${id}`),

  registrarDosis: (data: RegistrarDosisPayload) =>
    apiClient.post<{ ok: boolean; id: number }>('/vacunas/historial', data),

  // Verificacion QR y aplicacion por token viven en `certificadosApi`
  // (ver `@/api/certificados`). Aqui no se duplican para evitar drift.

  enviarMensaje: (data: EnviarMensajePayload) =>
    apiClient.post<{ ok: boolean; id: number }>('/buzon', data),

  listarMensajes: (curp: string) =>
    apiClient.get<MensajeRow[]>(`/buzon/${curp}`),

  reporteCoberturaUnidad: () =>
    apiClient.get<CoberturaUnidad[]>('/reportes/cobertura/unidad'),

  reporteCoberturaEstado: () =>
    apiClient.get<CoberturaEstado[]>('/reportes/cobertura/estado'),

  reporteCoberturaGrupo: () =>
    apiClient.get<CoberturaGrupo[]>('/reportes/cobertura/grupo'),

  reporteCoberturaVacuna: () =>
    apiClient.get<CoberturaVacuna[]>('/reportes/cobertura/vacuna'),

  reporteCallRecall: (dias = 30) =>
    apiClient.get<CallRecallCandidato[]>(`/reportes/call-recall?dias=${dias}`),

  listarAefi: (params?: { severidad?: string; limit?: number }) =>
    apiClient.get<AefiReporte[]>(`/aefi${qs(params || {})}`),

  listarAuditoria: (params?: { actor?: string; accion?: string; limit?: number }) =>
    apiClient.get<AuditoriaEvento[]>(`/auditoria${qs(params || {})}`),

  pushBroadcast: (data: { curps: string[]; titulo: string; cuerpo: string }) =>
    apiClient.post<{ enviados: number }>('/push/broadcast', data),

  dispararCallRecall: (dias = 30) =>
    apiClient.post<{ candidatos: number; push_result?: { enviados?: number } }>(`/push/call-recall?dias=${dias}`),
}
