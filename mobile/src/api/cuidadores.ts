/**
 * API de cuidadores / dependientes.
 */
import { apiClient } from './client'

export interface Dependiente {
  id:                 number
  curp:               string
  nombre:             string
  apellido_paterno:   string
  apellido_materno:   string | null
  grupo_prioritario:  string
  relacion:           string
  fecha_nacimiento:   string | null
}

export const cuidadoresApi = {
  listar: (curpCuidador: string) =>
    apiClient.get<Dependiente[]>(`/cuidadores/${curpCuidador}`),

  agregar: (data: { curp_cuidador: string; curp_dependiente: string; relacion: string }) =>
    apiClient.post<{ ok: boolean; id: number }>(`/cuidadores`, data),

  eliminar: (cuidadorId: number) =>
    apiClient.delete<{ ok: boolean }>(`/cuidadores/${cuidadorId}`),
}
