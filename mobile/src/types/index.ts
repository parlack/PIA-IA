export type GrupoPrioritario = 'ninguno' | 'adulto_mayor' | 'embarazada' | 'personal_salud' | 'cronico'

export interface UsuarioPublico {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  celular: string | null
  correo: string | null
  nss: string | null
  rol: string
  medico_familiar: string | null
  unidad_nombre: string | null
  unidad_telefono: string | null
  ciudad: string | null
  estado: string | null
  grupo_prioritario: GrupoPrioritario | null
  fecha_nacimiento: string | null
  sexo: 'H' | 'M' | null
}

export interface ResumenVacuna {
  vacuna_id: number
  nombre: string
  dosis_total: number
  dosis_aplicadas: number
  completa: boolean
  ultima_fecha: string | null
}

export interface HistorialResponse {
  resumen: ResumenVacuna[]
  historial: unknown[]
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

export interface LoginResponse {
  autenticado: boolean
  curp: string
  nombre: string
  apellido_paterno: string
  correo: string | null
  rol: string
}
