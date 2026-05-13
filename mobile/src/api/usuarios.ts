import { apiClient } from './client'
import type { UsuarioPublico } from '@/types'

export const usuariosApi = {
  getMe: (curp: string) =>
    apiClient.get<UsuarioPublico>(`/usuarios/${curp}`),
}
