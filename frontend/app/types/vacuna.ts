export interface ResumenVacuna {
  vacuna_id: number
  nombre: string
  dosis_total: number
  dosis_aplicadas: number
  completa: boolean
  ultima_fecha: string | null
}

export interface RegistroHistorial {
  id: number
  vacuna_id: number
  numero_dosis: number
  fecha_aplicacion: string
  lugar_aplicacion: string | null
  lote: string | null
  registrado_en: string
  vacuna_nombre: string
  dosis_total: number
}

export interface HistorialResponse {
  resumen: ResumenVacuna[]
  historial: RegistroHistorial[]
}

export interface VacunaCatalogo {
  id: number
  nombre: string
  enfermedad: string
  dosis_descripcion: string | null
  dosis_total: number
}

export type PrioridadAlerta = 'alta' | 'normal'

export interface Alerta {
  vacuna_id: number
  nombre: string
  dosis_faltantes: number
  dosis_total: number
  dosis_aplicadas: number
  prioridad: PrioridadAlerta
}

export interface AlertasResponse {
  alertas: Alerta[]
  grupo_prioritario: string
}

export interface RegistrarDosisPayload {
  curp_usuario: string
  vacuna_id: number
  numero_dosis: number
  fecha_aplicacion: string
  lugar_aplicacion?: string | null
  lote?: string | null
  modificado_por: string
}
