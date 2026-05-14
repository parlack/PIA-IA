/**
 * API certificados / QR personal.
 *
 * Endpoints expuestos por `backend/routers/certificados.py`:
 *  - GET  /certificados/{curp}/qr-token
 *  - GET  /certificados/verificar/{token}
 *  - POST /certificados/aplicar-por-token
 */
import { apiClient } from './client'

export type UsuarioVerificado = {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  grupo_prioritario?: string | null
}

export type ResumenVacuna = {
  vacuna_id: number
  nombre: string
  dosis_total: number
  dosis_aplicadas: number
  completa: boolean
}

export type VerificarQrResponse =
  | { valido: false }
  | {
      valido: true
      usuario: UsuarioVerificado
      resumen: ResumenVacuna[]
      total_dosis: number
    }

export type AplicarPorTokenPayload = {
  token: string
  vacuna_id: number
  numero_dosis: number
  fecha_aplicacion: string // YYYY-MM-DD
  lugar_aplicacion?: string
  lote?: string
  actor_curp: string
}

export type AplicarPorTokenResponse = {
  ok: true
  id: number
  usuario: {
    curp: string
    nombre: string
    apellido_paterno: string
    apellido_materno: string | null
  }
}

export const certificadosApi = {
  obtenerTokenQr: (curp: string) =>
    apiClient.get<{ token: string; expira_en: number; expira_en_iso: string }>(
      `/certificados/${curp}/qr-token`,
    ),

  verificarToken: (token: string) =>
    apiClient.get<VerificarQrResponse>(`/certificados/verificar/${token}`),

  aplicarPorToken: (data: AplicarPorTokenPayload) =>
    apiClient.post<AplicarPorTokenResponse>(
      '/certificados/aplicar-por-token',
      data,
    ),
}
