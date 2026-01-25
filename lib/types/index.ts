export type DocumentoTipo = 'CC' | 'CE' | 'Pasaporte' | 'TI' | 'Otro'
export type UserRole = 'admin' | 'coordinador' | 'lider' | 'validador' | 'confirmador' | 'consultor'
export type PersonaEstado = 'DATOS_PENDIENTES' | 'CON_NOVEDAD' | 'VERIFICADO' | 'CONFIRMADO' | 'COMPLETADO'

export interface Profile {
  id: string
  nombres: string
  apellidos: string
  tipo_documento: DocumentoTipo
  numero_documento: string
  fecha_nacimiento?: string
  telefono?: string
  direccion?: string
  barrio_id?: number
  barrio?: Barrio
  role: UserRole
  departamento?: string
  municipio?: string
  zona?: string
  candidato_id?: string
  coordinador_id?: string
  puesto_votacion_id?: number
  puesto_votacion?: PuestoVotacion
  mesa_votacion?: string
  created_at: string
  updated_at: string
}

export interface Persona {
  id: string
  nombres: string
  apellidos: string
  tipo_documento: DocumentoTipo
  numero_documento: string
  fecha_nacimiento?: string
  fecha_expedicion?: string
  profesion?: string
  edad?: number
  numero_celular?: string
  direccion?: string
  barrio_id?: number
  barrio?: Barrio
  departamento?: string
  municipio?: string
  puesto_votacion_id?: number
  puesto_votacion?: PuestoVotacion
  mesa_votacion?: string
  registrado_por: string
  es_importado: boolean
  importacion_id?: string
  created_at: string
  updated_at: string
  // Nuevos campos de estado y trazabilidad
  estado: PersonaEstado
  estado_anterior?: PersonaEstado
  validado_por?: string
  validado_at?: string
  confirmado_estado_por?: string
  confirmado_estado_at?: string
}

export interface VotoConfirmacion {
  id: string
  persona_id: string
  imagen_url: string
  imagen_path: string
  confirmado_por: string
  confirmado_at: string
  reversado: boolean
  reversado_por?: string
  reversado_at?: string
  created_at: string
  updated_at: string
}

export interface Importacion {
  id: string
  usuario_id: string
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  archivo_nombre?: string
  errores?: Record<string, any>
  created_at: string
}

export interface PersonaWithConfirmacion extends Persona {
  confirmacion?: VotoConfirmacion
  novedades?: Novedad[]
  novedad_activa?: Novedad
  validado_por_profile?: ProfileBasic
  confirmado_estado_por_profile?: ProfileBasic
}

export interface ProfileBasic {
  id: string
  nombres: string
  apellidos: string
  numero_documento: string
}

export interface Candidato {
  id: string
  nombre_completo: string
  numero_tarjeton: string
  imagen_url?: string
  imagen_path?: string
  partido_grupo?: string
  es_por_defecto: boolean
  created_at: string
  updated_at: string
}

export interface Barrio {
  id: number
  codigo: string
  nombre: string
}

export interface PuestoVotacion {
  id: number
  codigo: string
  nombre: string
  direccion?: string
}

export interface Novedad {
  id: string
  observacion: string
  resuelta: boolean
  resuelta_at?: string
  persona_id: string
  creada_por: string
  creada_por_profile?: ProfileBasic
  resuelta_por?: string
  resuelta_por_profile?: ProfileBasic
  created_at: string
  updated_at: string
}

export interface FiltroLider {
  id: string
  filtro_id: string
  lider_id: string
  created_at: string
}

export interface Filtro extends Profile {
  lideres_asignados?: ProfileBasic[]
  lideres_count?: number
  coordinador?: ProfileBasic
  candidato?: {
    id: string
    nombre_completo: string
  }
}

