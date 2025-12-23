export type DocumentoTipo = 'CC' | 'CE' | 'Pasaporte' | 'TI' | 'Otro'
export type UserRole = 'admin' | 'coordinador' | 'lider'

export interface Profile {
  id: string
  nombres: string
  apellidos: string
  tipo_documento: DocumentoTipo
  numero_documento: string
  fecha_nacimiento?: string
  telefono?: string
  role: UserRole
  departamento?: string
  municipio?: string
  zona?: string
  candidato_id?: string
  coordinador_id?: string
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

