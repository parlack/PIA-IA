export interface AdminStats {
  total_usuarios: number
  total_dosis: number
  mensajes_no_leidos: number
  total_vacunas_catalogo: number
  top_vacunas: { nombre: string; aplicaciones: number }[]
  grupos_prioritarios: { grupo_prioritario: string; total: number }[]
  total_hombres: number
  total_mujeres: number
}

export interface UsuarioAdminRow {
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
  grupo_prioritario: string | null
  fecha_nacimiento: string | null
  sexo: 'H' | 'M' | null
}

export interface UnidadMedica {
  id: number
  nombre: string
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  estado: string | null
  latitud?: number | null
  longitud?: number | null
}

export interface CatalogoVacunaRow {
  id: number
  nombre: string
  enfermedad: string
  dosis_descripcion: string | null
  dosis_total: number
}

export interface CoberturaUnidad {
  id: number
  nombre: string
  ciudad: string | null
  estado: string | null
  total_usuarios: number
  dosis_aplicadas: number
  cobertura_pct: number
  latitud?: number | null
  longitud?: number | null
}

export interface CoberturaEstado {
  estado: string
  total_usuarios: number
  dosis_aplicadas: number
  cobertura_pct: number
}

export interface CoberturaGrupo {
  grupo_prioritario: string
  total_usuarios: number
  dosis_aplicadas: number
  cobertura_pct: number
}

export interface CoberturaVacuna {
  id: number
  nombre: string
  usuarios_con_dosis: number
  total_usuarios: number
  cobertura_pct: number
}

export interface CallRecallCandidato {
  curp: string
  nombre: string
  apellido_paterno: string
  correo: string | null
  celular: string | null
  dias_sin_dosis: number
  pendientes: number
}

export interface AefiReporte {
  id: number
  dosis_id: number
  curp_usuario: string | null
  nombre_usuario?: string | null
  vacuna_nombre?: string | null
  sintomas: string
  severidad: string
  inicio_minutos: number | null
  requiere_seguimiento: number | boolean
  creado_en: string
}

export interface AuditoriaEvento {
  id: number
  curp_actor: string | null
  accion: string
  recurso: string | null
  recurso_id: string | null
  ip: string | null
  user_agent: string | null
  datos: string | null
  creado_en: string
}

export interface MensajeRow {
  id: number
  titulo: string
  contenido: string
  tipo: string
  leido: number
  enviado_en: string
  leido_en: string | null
  remitente_curp: string
  destinatario_curp: string
  remitente_nombre?: string
  remitente_apellido?: string
}
