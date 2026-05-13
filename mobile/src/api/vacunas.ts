import { apiClient } from './client'
import type { HistorialResponse, AlertasResponse } from '@/types'

export const vacunasApi = {
  getHistorial: (curp: string) =>
    apiClient.get<HistorialResponse>(`/usuarios/${curp}/vacunas`),

  getAlertas: (curp: string) =>
    apiClient.get<AlertasResponse>(`/alertas/${curp}`),
}
