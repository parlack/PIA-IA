export type TipoMensaje = 'informacion' | 'advertencia' | 'urgente'

export interface Mensaje {
  id: number
  titulo: string
  contenido: string
  tipo: TipoMensaje
  leido: number
  enviado_en: string
  leido_en: string | null
  remitente_nombre: string
  remitente_apellido: string
}

export interface EnviarMensajePayload {
  destinatario_curp: string
  remitente_curp: string
  titulo: string
  contenido: string
  tipo: TipoMensaje
}
