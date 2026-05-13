export type GrupoPrioritario = 'ninguno' | 'adulto_mayor' | 'embarazada' | 'personal_salud' | 'cronico'

export type Sexo = 'H' | 'M' | null

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
  sexo: Sexo
}

export interface UsuarioListadoAdmin {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  correo: string | null
  celular: string | null
  rol: string
  nss: string | null
  creado_en: string
  unidad_medica_id: number | null
  unidad_nombre: string | null
  grupo_prioritario: GrupoPrioritario | null
  fecha_nacimiento: string | null
  sexo: Sexo
}

export interface UsuarioUpdatePayload {
  nombre?: string
  apellido_paterno?: string
  apellido_materno?: string
  celular?: string
  correo?: string
  unidad_medica_id?: number
  medico_familiar?: string
  nss?: string
  grupo_prioritario?: GrupoPrioritario
  fecha_nacimiento?: string
  sexo?: Sexo
}

export interface AdminCrearUsuarioPayload {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  correo?: string
  celular?: string
  rol?: string
}
