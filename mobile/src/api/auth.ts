import { apiClient } from './client'
import type { LoginResponse } from '@/types'

export const authApi = {
  login: (curp: string, contrasena?: string) =>
    apiClient.post<LoginResponse>('/auth/login', { curp, contrasena }),

  setPassword: (curp: string, contrasena: string) =>
    apiClient.post('/auth/set-password', { curp, contrasena }),

  aceptarTerminos: (curp: string) =>
    apiClient.post('/auth/aceptar-terminos', { curp }),

  registrarPushToken: (curp: string, token: string) =>
    apiClient.post('/push/token', { curp, token }),
}
