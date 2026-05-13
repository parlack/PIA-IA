import type { GrupoPrioritario } from './usuario'

export interface AdminStats {
  total_usuarios: number
  total_dosis: number
  mensajes_no_leidos: number
  total_vacunas_catalogo: number
  top_vacunas: { nombre: string; aplicaciones: number }[]
  grupos_prioritarios?: { grupo_prioritario: GrupoPrioritario; total: number }[]
  total_hombres?: number
  total_mujeres?: number
}

export interface UnidadMedica {
  id: number
  nombre: string
  telefono?: string | null
  ciudad?: string | null
  estado?: string | null
}
