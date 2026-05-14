/**
 * API alergias y contraindicaciones.
 *
 * Endpoints expuestos por `backend/routers/alergias.py`:
 *  - GET    /alergias/{curp}
 *  - POST   /alergias
 *  - DELETE /alergias/{id}
 *  - POST   /alergias/contraindicaciones
 *  - DELETE /alergias/contraindicaciones/{id}
 */
import { apiClient } from './client'

export type SeveridadAlergia = 'leve' | 'moderada' | 'severa' | 'anafilaxia'

export type Alergia = {
  id: number
  sustancia: string
  severidad: string
  observaciones: string | null
  creado_en: string
}

export type Contraindicacion = {
  id: number
  descripcion: string
  vacuna_id: number | null
  vacuna_nombre: string | null
  permanente: number // 1 / 0
  creado_en: string
}

export type AlergiasPayload = {
  alergias: Alergia[]
  contraindicaciones: Contraindicacion[]
}

export type CrearAlergiaPayload = {
  curp: string
  sustancia: string
  severidad: SeveridadAlergia
  observaciones?: string
}

export type CrearContraindicacionPayload = {
  curp: string
  descripcion: string
  vacuna_id?: number
  permanente: boolean
}

export const alergiasApi = {
  listar: (curp: string) => apiClient.get<AlergiasPayload>(`/alergias/${curp}`),

  crearAlergia: (data: CrearAlergiaPayload) =>
    apiClient.post<{ ok: true; id: number }>('/alergias', data),

  eliminarAlergia: (id: number) =>
    apiClient.delete<{ ok: true }>(`/alergias/${id}`),

  crearContraindicacion: (data: CrearContraindicacionPayload) =>
    apiClient.post<{ ok: true; id: number }>(
      '/alergias/contraindicaciones',
      data,
    ),

  eliminarContraindicacion: (id: number) =>
    apiClient.delete<{ ok: true }>(`/alergias/contraindicaciones/${id}`),
}
