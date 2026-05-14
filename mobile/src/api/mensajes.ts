/**
 * API del buzon de mensajes del ciudadano.
 */
import { apiClient } from './client'

export interface MensajeRow {
  id:                  number
  titulo:              string
  contenido:           string
  tipo:                'informacion' | 'advertencia' | 'urgente'
  leido:               number
  enviado_en:          string
  leido_en:            string | null
  remitente_nombre:    string
  remitente_apellido:  string
}

export const mensajesApi = {
  getMensajes: (curp: string) =>
    apiClient.get<MensajeRow[]>(`/buzon/${curp}`),

  marcarLeido: (id: number) =>
    apiClient.patch<{ ok: boolean }>(`/buzon/${id}/leer`, {}),

  eliminarMensaje: (id: number) =>
    apiClient.delete<{ ok: boolean }>(`/buzon/${id}`),
}
