/**
 * API AEFI (eventos adversos post-vacunacion).
 *
 * Endpoints expuestos por `backend/routers/aefi.py`:
 *  - GET  /aefi/usuario/{curp}                 -> Reporte[]
 *  - GET  /aefi/usuario/{curp}/dosis-reportables -> { ventana_dias, dosis }
 *  - POST /aefi                                -> { ok, id }
 */
import { apiClient } from './client'

export type SeveridadAefi = 'leve' | 'moderada' | 'severa' | 'grave'

export type AefiReporteUsuario = {
  id: number
  dosis_id: number
  sintomas: string
  severidad: SeveridadAefi
  inicio_minutos: number | null
  requiere_seguimiento: number // 1 / 0
  vacuna_nombre: string
  fecha_aplicacion: string
  creado_en: string
}

export type DosisReportable = {
  id: number
  vacuna_nombre: string
  numero_dosis: number
  fecha_aplicacion: string
  dias_transcurridos: number
}

export type DosisReportablesPayload = {
  ventana_dias: number
  dosis: DosisReportable[]
}

export type ReportarAefiPayload = {
  dosis_id: number
  sintomas: string
  severidad: SeveridadAefi
  inicio_minutos?: number
  requiere_seguimiento: boolean
}

export const aefiApi = {
  listarPorUsuario: (curp: string) =>
    apiClient.get<AefiReporteUsuario[]>(`/aefi/usuario/${curp}`),

  dosisReportables: (curp: string) =>
    apiClient.get<DosisReportablesPayload>(
      `/aefi/usuario/${curp}/dosis-reportables`,
    ),

  reportar: (data: ReportarAefiPayload) =>
    apiClient.post<{ ok: true; id: number }>('/aefi', data),
}
